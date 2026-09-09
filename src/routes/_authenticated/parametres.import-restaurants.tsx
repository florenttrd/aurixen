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
import {
  importRestaurantReportFn,
  type RestaurantImportPayload,
} from "@/lib/restaurants-import.functions";

export const Route = createFileRoute("/_authenticated/parametres/import-restaurants")({
  head: () => ({
    meta: [
      { title: "Import des fiches restaurants — AURIXEN" },
      {
        name: "description",
        content:
          "Importer des fiches de restaurants rédigées par une IA dans la base Danse du Lion.",
      },
      { property: "og:title", content: "Import des fiches restaurants — AURIXEN" },
      {
        property: "og:description",
        content: "Alimenter la base restaurants AURIXEN depuis un rapport IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImportRestaurantsPage,
});

const TEMPLATE = `Tu es assistant prospection pour un spectacle de danse du lion. À partir des informations et captures que je te donne, produis UNIQUEMENT un rapport en markdown, sans commentaire autour, au format exact suivant :

# Fiches restaurants — <ville ou période>

| Nom | Ville | Adresse | Cuisine | Téléphone | Email | Site web | Taille | Parking | Intérêt | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Exemple Wok | Bruxelles | Rue X 12, 1000 | Chinois | +32 2 123 45 67 | contact@exemple.be | exemple.be | 80 couverts | Oui | interesse | Ouvert le midi |

Règles :
- une ligne par restaurant
- colonne Intérêt : uniquement inconnu, froid, interesse ou client
- laisse la cellule vide si la donnée est absente
- n'invente jamais un numéro, une adresse ou un email`;

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

function ImportRestaurantsPage() {
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const runImport = useServerFn(importRestaurantReportFn) as (args: {
    data: RestaurantImportPayload;
  }) => Promise<{ created: number; updated: number; names: string[] }>;

  const importReport = useMutation({
    mutationFn: (payload: RestaurantImportPayload) => runImport({ data: payload }),
    onSuccess: (r) => {
      toast.success(`${r.created} fiches ajoutées, ${r.updated} mises à jour`);
      setText("");
      setFileName(null);
      if (fileInput.current) fileInput.current.value = "";
      qc.invalidateQueries({ queryKey: ["restaurants"] });
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
      file: { name: file.name, mimeType: file.type || "text/plain", dataBase64 },
    });
  };

  const busy = importReport.isPending;

  return (
    <Shell wordmark="AURIXEN" subtitle="Import restaurants" backTo="/parametres" nav={HUB_NAV}>
      <SectionTitle overline="Danse du Lion" title="Fiches restaurants par IA" />

      <section className="surface-panel mb-4 p-4">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-primary" /> 1. Le modèle à donner à l'IA
        </h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Copiez ce texte, collez-le dans ChatGPT avec vos informations ou captures, puis récupérez
          le tableau obtenu.
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
        <h3 className="text-sm font-medium">2. Coller le tableau</h3>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Collez ici le tableau markdown des restaurants…"
          className="mt-3 min-h-40 rounded-xl text-sm"
        />
        <Button
          className="mt-3 h-12 w-full rounded-xl"
          disabled={busy || text.trim().length === 0}
          onClick={() => importReport.mutate({ text })}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : null}
          Importer les fiches collées
        </Button>
      </section>

      <section className="surface-panel p-4">
        <h3 className="text-sm font-medium">3. Ou déposer un fichier</h3>
        <p className="mt-1 text-[11px] text-muted-foreground">
          PDF, markdown, texte, CSV ou capture d'écran (15 Mo max). Le fichier est lu côté serveur
          puis les fiches sont ajoutées à la base.
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
          Un restaurant déjà présent sous le même nom est mis à jour plutôt que dupliqué.
        </p>
      </section>
    </Shell>
  );
}
