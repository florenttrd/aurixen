import { createFileRoute } from "@tanstack/react-router";

import { statusOf } from "@/components/aurixen/ProjectConnectors";
import { Shell, SectionTitle } from "@/components/aurixen/Shell";
import { HUB_NAV } from "@/components/aurixen/navs";
import { useConnectorsStatus, useProjectConnectors } from "@/hooks/useConnectors";
import { CONNECTORS, CONNECTOR_CATEGORIES } from "@/lib/connectors";

export const Route = createFileRoute("/_authenticated/parametres/connecteurs")({
  head: () => ({
    meta: [
      { title: "Connecteurs — AURIXEN" },
      { name: "description", content: "Tous les services externes reliés à vos projets AURIXEN." },
    ],
  }),
  component: ConnectorsHub,
});

const PROJECT_NAMES: Record<string, string> = { "leo-valen": "Léo Valen", "danse-du-lion": "Danse du Lion" };

function ConnectorsHub() {
  const { data: status = [], isLoading } = useConnectorsStatus();
  const { data: links = [] } = useProjectConnectors();

  return (
    <Shell wordmark="AURIXEN" subtitle="Connecteurs" backTo="/parametres" nav={HUB_NAV}>
      <SectionTitle overline="Sources externes" title="Connecteurs" />
      <p className="mb-4 text-xs text-muted-foreground">
        Les jetons restent côté serveur. Ajoutez un connecteur à un projet depuis ses réglages.
      </p>
      {isLoading ? <p className="text-sm text-muted-foreground">Vérification des connexions…</p> : null}
      <div className="space-y-6">
        {CONNECTOR_CATEGORIES.map((cat) => (
          <section key={cat.key}>
            <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {cat.icon} {cat.label}
            </p>
            <ul className="space-y-2">
              {CONNECTORS.filter((c) => c.category === cat.key).map((c) => {
                const s = status.find((x) => x.connector_id === c.id);
                const ui = statusOf(c, s);
                const used = links.filter((l) => l.connector_id === c.id).map((l) => PROJECT_NAMES[l.project_slug] ?? l.project_slug);
                return (
                  <li key={c.id} className="surface-panel p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{c.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{c.name}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{c.description}</span>
                      </span>
                      <span className="shrink-0 text-[11px]">
                        {ui.dot} {ui.label}
                      </span>
                    </div>
                    {c.availability !== "soon" ? (
                      <div className="mt-2 space-y-0.5 pl-9 text-[11px] text-muted-foreground">
                        {s?.account_label ? <p>Compte : {s.account_label}</p> : null}
                        <p>
                          {s?.items_count ?? 0} éléments
                          {s?.last_sync_at ? ` · ${new Date(s.last_sync_at).toLocaleString("fr-FR")}` : ""}
                        </p>
                        <p>Utilisé par : {used.length ? used.join(", ") : "aucun projet"}</p>
                        <p>Permissions : {c.permissions.filter((p) => p.default).map((p) => p.label).join(", ")}</p>
                        {s?.missing.length ? <p className="text-destructive">À configurer : {s.missing.join(", ")}</p> : null}
                        {s?.last_error ? <p className="text-destructive">{s.last_error}</p> : null}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </Shell>
  );
}
