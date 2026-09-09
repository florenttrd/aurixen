import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, FileUp, Plug, Store } from "lucide-react";

import { Shell, SectionTitle } from "@/components/aurixen/Shell";
import { HUB_NAV } from "@/components/aurixen/navs";

export const Route = createFileRoute("/_authenticated/parametres/")({
  head: () => ({
    meta: [
      { title: "Paramètres — AURIXEN" },
      { name: "description", content: "Réglages du centre de pilotage AURIXEN." },
    ],
  }),
  component: SettingsIndex,
});

function SettingsIndex() {
  return (
    <Shell wordmark="AURIXEN" subtitle="Paramètres" backTo="/hub" nav={HUB_NAV}>
      <SectionTitle overline="Configuration" title="Paramètres" />
      <div className="space-y-3">
        <Link to="/parametres/integrations" className="surface-panel flex items-center gap-3 p-4">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Plug className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Intégrations</span>
            <span className="block text-xs text-muted-foreground">Gumroad</span>
          </span>
          <ArrowUpRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          to="/parametres/import-pinterest"
          className="surface-panel flex items-center gap-3 p-4"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <FileUp className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Import Pinterest</span>
            <span className="block text-xs text-muted-foreground">
              Rapport collé ou fichier (PDF, markdown, capture)
            </span>
          </span>
          <ArrowUpRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          to="/parametres/import-restaurants"
          className="surface-panel flex items-center gap-3 p-4"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Store className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Import restaurants</span>
            <span className="block text-xs text-muted-foreground">
              Fiches rédigées par IA (tableau collé ou fichier)
            </span>
          </span>
          <ArrowUpRight className="size-4 text-muted-foreground" />
        </Link>
      </div>

    </Shell>
  );
}
