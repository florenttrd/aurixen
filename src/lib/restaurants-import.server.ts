// Server-only: lecture d'un rapport de fiches restaurants (texte, markdown, PDF ou capture)
// et import dans la base. Aucune clé n'atteint le navigateur.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const RESTAURANT_TEMPLATE = `Tu es assistant prospection pour un spectacle de danse du lion.
À partir des informations et captures que je te donne, produis UNIQUEMENT un rapport en markdown,
sans commentaire autour, au format exact suivant :

# Fiches restaurants — <ville ou période>

| Nom | Ville | Adresse | Cuisine | Téléphone | Email | Site web | Taille | Parking | Intérêt | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Exemple Wok | Bruxelles | Rue X 12, 1000 | Chinois | +32 2 123 45 67 | contact@exemple.be | exemple.be | 80 couverts | Oui | interesse | Ouvert le midi |

Règles :
- une ligne par restaurant
- colonne Intérêt : uniquement inconnu, froid, interesse ou client
- laisse la cellule vide si la donnée est absente
- n'invente jamais un numéro, une adresse ou un email`;

type Extracted = {
  name?: string | null;
  location?: string | null;
  address?: string | null;
  cuisine?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  size?: string | null;
  parking?: string | null;
  interest?: string | null;
  notes?: string | null;
};

const INTERESTS = ["inconnu", "froid", "interesse", "client"];

const SYSTEM = `Tu extrais des fiches de restaurants depuis un rapport (markdown, texte, PDF ou capture d'écran).
Réponds uniquement en JSON valide de la forme:
{"restaurants":[{"name":"","location":null,"address":null,"cuisine":null,"phone":null,"email":null,"website":null,"size":null,"parking":null,"interest":"inconnu","notes":null}]}
N'invente aucune donnée: mets null quand l'information est absente. interest vaut inconnu, froid, interesse ou client.`;

export type ReportInput = {
  text?: string;
  file?: { name: string; mimeType: string; dataBase64: string };
};

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } }
  | { type: "file"; file: { filename: string; file_data: string } };

function clean(value: unknown) {
  const s = typeof value === "string" ? value.trim() : "";
  return s.length ? s : null;
}

async function extract(input: ReportInput): Promise<Extracted[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("La lecture automatique des rapports n'est pas configurée.");

  const content: ContentBlock[] = [
    { type: "text", text: "Extrais toutes les fiches de restaurants de ce rapport." },
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

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  let parsed: { restaurants?: Extracted[] };
  try {
    parsed = JSON.parse(raw) as { restaurants?: Extracted[] };
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    parsed = match ? (JSON.parse(match[0]) as { restaurants?: Extracted[] }) : {};
  }
  return Array.isArray(parsed.restaurants) ? parsed.restaurants : [];
}

export async function importRestaurantReport(userId: string, input: ReportInput) {
  const found = await extract(input);
  const rows = found
    .filter((r) => (r.name ?? "").trim().length > 0)
    .map((r) => {
      const interest = clean(r.interest)?.toLowerCase() ?? "inconnu";
      return {
        user_id: userId,
        name: r.name!.trim(),
        location: clean(r.location),
        address: clean(r.address),
        cuisine: clean(r.cuisine),
        phone: clean(r.phone),
        email: clean(r.email),
        website: clean(r.website),
        size: clean(r.size),
        parking: clean(r.parking),
        interest: INTERESTS.includes(interest) ? interest : "inconnu",
        notes: clean(r.notes),
      };
    });

  if (!rows.length) {
    throw new Error("Aucun restaurant détecté dans ce rapport. Vérifiez le format du tableau.");
  }

  const { data: existing, error: readError } = await supabaseAdmin
    .from("restaurants")
    .select("id,name")
    .eq("user_id", userId);
  if (readError) throw new Error(readError.message);

  const byName = new Map(
    (existing ?? []).map((r) => [r.name.trim().toLowerCase(), r.id as string]),
  );

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const id = byName.get(row.name.toLowerCase());
    if (id) {
      const { user_id: _ignored, ...patch } = row;
      const { error } = await supabaseAdmin.from("restaurants").update(patch).eq("id", id);
      if (error) throw new Error(error.message);
      updated += 1;
    } else {
      const { error } = await supabaseAdmin.from("restaurants").insert(row);
      if (error) throw new Error(error.message);
      byName.set(row.name.toLowerCase(), "inserted");
      created += 1;
    }
  }

  return { created, updated, names: rows.slice(0, 5).map((r) => r.name) };
}
