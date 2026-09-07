// Server-only: lecture d'un rapport Pinterest (texte, markdown, PDF ou capture)
// et import des pins dans la base. Aucune clé n'atteint le navigateur.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const REPORT_TEMPLATE = `Tu es analyste Pinterest. À partir des captures d'écran que je te donne,
produis UNIQUEMENT un rapport en markdown, sans commentaire autour, au format exact suivant :

# Rapport Pinterest — <période>

| Titre du pin | Date de publication | Impressions | Enregistrements | Clics | Clics sortants | Produit | Tableau |
|---|---|---|---|---|---|---|---|
| Exemple de pin | 2026-08-14 | 12400 | 320 | 145 | 38 | Produit A | Inspiration |

Règles :
- une ligne par pin, dates au format AAAA-MM-JJ (laisse vide si inconnue)
- nombres entiers sans espace ni séparateur (12400, pas 12,4k)
- laisse la cellule vide si la donnée n'apparaît pas sur les captures
- n'invente jamais de chiffre`;

type ExtractedPin = {
  title?: string | null;
  published_at?: string | null;
  impressions?: number | null;
  saves?: number | null;
  clicks?: number | null;
  outbound_clicks?: number | null;
  product?: string | null;
  board?: string | null;
  notes?: string | null;
};

const SYSTEM = `Tu extrais des données de pins Pinterest depuis un rapport (markdown, texte, PDF ou capture d'écran).
Réponds uniquement en JSON valide de la forme:
{"pins":[{"title":"","published_at":"AAAA-MM-JJ ou null","impressions":0,"saves":0,"clicks":0,"outbound_clicks":0,"product":null,"board":null,"notes":null}]}
N'invente aucune donnée: mets null quand l'information est absente. Convertis "12,4k" en 12400.`;

function slug(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function toInt(value: unknown) {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

function isoDate(value: unknown) {
  if (typeof value !== "string") return null;
  const m = value.match(/\d{4}-\d{2}-\d{2}/);
  return m ? new Date(`${m[0]}T12:00:00.000Z`).toISOString() : null;
}

export type ReportInput = {
  text?: string;
  file?: { name: string; mimeType: string; dataBase64: string };
};

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

async function extract(input: ReportInput): Promise<ExtractedPin[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("La lecture automatique des rapports n'est pas configurée.");

  const content: ContentBlock[] = [
    { type: "text", text: "Extrais tous les pins de ce rapport Pinterest." },
  ];

  if (input.text?.trim()) {
    content.push({ type: "text", text: input.text.trim().slice(0, 200_000) });
  }
  if (input.file) {
    const dataUrl = `data:${input.file.mimeType};base64,${input.file.dataBase64}`;
    if (input.file.mimeType.startsWith("image/")) {
      content.push({ type: "image_url", image_url: { url: dataUrl } });
    } else if (input.file.mimeType === "application/pdf") {
      content.push({ type: "file", file: { filename: input.file.name, file_data: dataUrl } });
    } else {
      const decoded = Buffer.from(input.file.dataBase64, "base64").toString("utf8");
      content.push({ type: "text", text: decoded.slice(0, 200_000) });
    }
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Lovable-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.8-flash",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content },
      ],
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    const message = body.error?.message;
    if (res.status === 402) {
      throw new Error(message ?? "Crédits IA épuisés : rechargez pour relancer la lecture.");
    }
    if (res.status === 429) {
      throw new Error("Trop de demandes d'un coup, réessayez dans quelques secondes.");
    }
    throw new Error(message ?? `Lecture du rapport impossible (${res.status})`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  let parsed: { pins?: ExtractedPin[] };
  try {
    parsed = JSON.parse(raw) as { pins?: ExtractedPin[] };
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    parsed = match ? (JSON.parse(match[0]) as { pins?: ExtractedPin[] }) : {};
  }
  return Array.isArray(parsed.pins) ? parsed.pins : [];
}

export async function importPinterestReport(userId: string, input: ReportInput) {
  const pins = await extract(input);
  const rows = pins
    .filter((p) => (p.title ?? "").trim().length > 0)
    .map((p) => {
      const title = p.title!.trim();
      const published = isoDate(p.published_at);
      return {
        user_id: userId,
        external_id: `rapport:${slug(title)}`,
        title,
        description: null,
        board: p.board?.trim() || null,
        product: p.product?.trim() || null,
        notes: p.notes?.trim() || null,
        status: published ? "publie" : "cree",
        published_at: published,
        impressions: toInt(p.impressions),
        saves: toInt(p.saves),
        clicks: toInt(p.clicks),
        outbound_clicks: toInt(p.outbound_clicks),
      };
    });

  if (!rows.length) {
    throw new Error("Aucun pin détecté dans ce rapport. Vérifiez le format du tableau.");
  }

  const { error } = await supabaseAdmin
    .from("pins")
    .upsert(rows, { onConflict: "user_id,external_id" });
  if (error) throw new Error(error.message);

  return { imported: rows.length, titles: rows.slice(0, 5).map((r) => r.title) };
}
