import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, Lock, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Shell, SectionTitle } from "@/components/aurixen/Shell";
import { HUB_NAV } from "@/components/aurixen/navs";
import { Button } from "@/components/ui/button";
import {
  disconnectIntegration,
  getIntegrations,
  syncGumroadNow,
  testGumroadNow,
} from "@/lib/integrations.functions";

export const Route = createFileRoute("/_authenticated/parametres/integrations")({
  head: () => ({
    meta: [
      { title: "Intégrations Gumroad — AURIXEN" },
      {
        name: "description",
        content: "Connexion sécurisée du compte Gumroad au centre de pilotage AURIXEN.",
      },
      { property: "og:title", content: "Intégrations Gumroad — AURIXEN" },
      {
        property: "og:description",
        content: "Ventes Gumroad synchronisées automatiquement dans AURIXEN.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: IntegrationsPage,
});

const STATUS_LABEL: Record<string, { dot: string; text: string }> = {
  connected: { dot: "🟢", text: "connecté" },
  disconnected: { dot: "🔴", text: "non connecté" },
  syncing: { dot: "🟠", text: "synchronisation en cours" },
  error: { dot: "🔴", text: "erreur de connexion" },
};

function IntegrationsPage() {
  const qc = useQueryClient();

  const fetchStatus = useServerFn(getIntegrations);
  const { data = [], isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => fetchStatus(),
    refetchInterval: (q) =>
      (q.state.data ?? []).some((i) => i.status === "syncing") ? 3000 : false,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["integrations"] });
    qc.invalidateQueries({ queryKey: ["sales"] });
  };

  const testGumroadFn = useServerFn(testGumroadNow) as () => Promise<{ label: string }>;
  const syncSalesFn = useServerFn(syncGumroadNow) as () => Promise<{ imported: number }>;

  const testGumroad = useMutation({
    mutationFn: () => testGumroadFn(),
    onSuccess: (r) => {
      toast.success(`Gumroad connecté (${r.label})`);
      invalidate();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      invalidate();
    },
  });

  const syncSales = useMutation({
    mutationFn: () => syncSalesFn(),
    onSuccess: (r) => {
      toast.success(`${r.imported} ventes synchronisées`);
      invalidate();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      invalidate();
    },
  });

  const disconnectFn = useServerFn(disconnectIntegration);
  const disconnect = useMutation({
    mutationFn: () => disconnectFn({ data: { provider: "gumroad" as const } }),
    onSuccess: () => {
      toast.success("Compte déconnecté");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const gumroad = data.find((i) => i.provider === "gumroad");
  const busy = testGumroad.isPending || syncSales.isPending || disconnect.isPending;

  return (
    <Shell wordmark="AURIXEN" subtitle="Intégrations" backTo="/parametres" nav={HUB_NAV}>
      <SectionTitle overline="Connexions sécurisées" title="Intégrations" />

      <div className="surface-panel mb-4 flex gap-3 p-4 text-xs text-muted-foreground">
        <Lock className="size-4 shrink-0 text-primary" />
        <p>
          Les clés et jetons sont stockés côté serveur uniquement. Ils ne sont jamais envoyés au
          navigateur ni affichés dans cette interface.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : (
        <div className="space-y-4">
          <section className="surface-panel p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-lg font-semibold">Gumroad</h3>
              <span className="text-xs">
                {STATUS_LABEL[gumroad?.status ?? "disconnected"]!.dot} Gumroad{" "}
                {STATUS_LABEL[gumroad?.status ?? "disconnected"]!.text}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Jeton d'accès personnel Gumroad (API v2), conservé côté serveur.
              {gumroad?.account_label ? ` Compte : ${gumroad.account_label}.` : ""}
              {gumroad?.last_sync_at
                ? ` Dernière synchro : ${new Date(gumroad.last_sync_at).toLocaleString("fr-FR")}.`
                : ""}
            </p>
            {gumroad && !gumroad.configured ? (
              <p className="mt-2 text-[11px] text-destructive">
                À renseigner dans les secrets : {gumroad.missing_secrets.join(", ")}
              </p>
            ) : null}
            {gumroad?.last_error ? (
              <p className="mt-2 text-[11px] text-destructive">{gumroad.last_error}</p>
            ) : null}
            <div className="mt-4 grid gap-2">
              <Button
                className="h-12 rounded-xl"
                disabled={busy || !gumroad?.configured}
                onClick={() => testGumroad.mutate()}
              >
                Tester la connexion
              </Button>
              <Button
                variant="secondary"
                className="h-12 rounded-xl"
                disabled={busy || gumroad?.status !== "connected"}
                onClick={() => syncSales.mutate()}
              >
                <RefreshCw className={syncSales.isPending ? "size-4 animate-spin" : "size-4"} />
                Synchroniser maintenant
              </Button>
              <Button
                variant="ghost"
                className="h-12 rounded-xl text-muted-foreground"
                disabled={busy || !gumroad || gumroad.status === "disconnected"}
                onClick={() => disconnect.mutate()}
              >
                Déconnecter
              </Button>
            </div>
          </section>

          <Link
            to="/parametres/import-pinterest"
            className="surface-panel flex items-center gap-3 p-4"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">Pinterest — import de rapport</span>
              <span className="block text-xs text-muted-foreground">
                Pas d'API Pinterest : les statistiques arrivent par rapport (texte ou fichier).
              </span>
            </span>
            <ArrowUpRight className="size-4 text-muted-foreground" />
          </Link>
        </div>
      )}
    </Shell>
  );
}
