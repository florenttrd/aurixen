import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Copy, FileUp, Loader2, Sparkles } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Shell, SectionTitle } from "@/components/aurixen/Shell";
import { HUB_NAV } from "@/components/aurixen/navs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { importPinterestReportFn, type ImportPayload } from "@/lib/pinterest-import.functions";

export const Route = createFileRoute("/_authenticated/parametres/import-pinterest")({
  head: () => ({
    meta: [
      { title: "Import du rapport Pinterest — AURIXEN" },
      {
        name: "description",
        content:
          "Importer les statistiques Pinterest depuis un rapport rédigé à partir de captures d'écran.",
      },
      { property: "og:title", content: "Import du rapport Pinterest — AURIXEN" },
      {
        property: "og:description",
        content: "Alimenter la bibliothèque de pins AURIXEN sans API Pinterest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImportPinterestPage,
});

const TEMPLATE = `Tu es analyste Pinterest. À partir des captures d'écran que je te donne, produis UNIQUEMENT un rapport en markdown, sans commentaire autour, au format exact suivant :

# Rapport Pinterest — <période>

| Titre du pin | Date de publication | Impressions | Enregistrements | Clics | Clics sortants | Produit | Tableau |
|---|---|---|---|---|---|---|---|
| Exemple de pin | 2026-08-14 | 12400 | 320 | 145 | 38 | Produit A | Inspiration |

Règles :
- une ligne par pin, dates au format AAAA-MM-JJ (laisse vide si inconnue)
- nombres entiers sans espace ni séparateur (12400, pas 12,4k)
- laisse la cellule vide si la donnée n'apparaît pas sur les captures
- n'invente jamais de chiffre`;

function readAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
    reader.readAsDataURL(file);
  });
}

function ImportPinterestPage() {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const runImport = useServerFn(importPinterestReportFn) as (args: {
    data: ImportPayload;
  }) => Promise<{ imported: number; titles: string[] }>;

  const importReport = useMutation({
    mutationFn: (payload: ImportPayload) => runImport({ data: payload }),
    onSuccess: (r) => {
      toast.success(`${r.imported} pins importés dans la bibliothèque`);
      setText("");
      setFileName(null);
      if (fileInput.current) fileInput.current.value = "";
      qc.invalidateQueries({ queryKey: ["pins"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Fichier trop lourd (15 Mo maximum)");
      return;
    }
    setFileName(file.name);
    const dataBase64 = await readAsBase64(file);
    importReport.mutate({
      file: {
        name: file.name,
        mimeType: file.type || "text/plain",
        dataBase64,
      },
    });
  };

  const busy = importReport.isPending;

  return (
    <Shell
      wordmark="AURIXEN"
      subtitle="Import Pinterest"
      backTo="/parametres"
      nav={HUB_NAV}
    >
      <SectionTitle overline="Sans API Pinterest" title="Import du rapport" />

      <section className="surface-panel mb-4 p-4">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-primary" /> 1. Le modèle à donner à ChatGPT
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Copiez ce texte, collez-le dans ChatGPT avec vos captures d'écran Pinterest, puis
          récupérez le rapport obtenu.
        </p>
        <pre className="mt-3 max-h-52 overflow-auto rounded-xl bg-muted/40 p-3 text-[10px] leading-relaxed whitespace-pre-wrap">
          {TEMPLATE}
        </pre>
        <Button
          variant="secondary"
          className="mt-3 h-12 w-full rounded-xl"
          onClick={() => {
            void navigator.clipboard.writeText(TEMPLATE);
            toast.success("Modèle copié");
          }}
        >
          <Copy className="size-4" /> Copier le modèle
        </Button>
      </section>

      <section className="surface-panel mb-4 p-4">
        <h3 className="text-sm font-medium">2. Coller le rapport</h3>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Collez ici le rapport markdown généré par ChatGPT…"
          className="mt-3 min-h-40 rounded-xl text-sm"
        />
        <Button
          className="mt-3 h-12 w-full rounded-xl"
          disabled={busy || text.trim().length === 0}
          onClick={() => importReport.mutate({ text })}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Importer le rapport collé
        </Button>
      </section>

      <section className="surface-panel p-4">
        <h3 className="text-sm font-medium">3. Ou déposer un fichier</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          PDF, markdown, texte, CSV ou capture d'écran (15 Mo max). Le fichier est lu côté serveur
          puis les pins sont ajoutés à la bibliothèque.
        </p>
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.md,.txt,.csv,image/*"
          className="hidden"
          onChange={(e) => void onPickFile(e.target.files?.[0])}
        />
        <Button
          variant="secondary"
          className="mt-3 h-12 w-full rounded-xl"
          disabled={busy}
          onClick={() => fileInput.current?.click()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
          {fileName ?? "Choisir un fichier"}
        </Button>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Un pin déjà importé sous le même titre est mis à jour plutôt que dupliqué.
        </p>
      </section>
    </Shell>
  );
}
