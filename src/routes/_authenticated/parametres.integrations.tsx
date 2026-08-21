import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Lock, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { Shell, SectionTitle } from "@/components/aurixen/Shell";
import { HUB_NAV } from "@/components/aurixen/navs";
import { Button } from "@/components/ui/button";
import {
  disconnectIntegration,
  getIntegrations,
  startPinterestOAuth,
  syncGumroadNow,
  syncPinterestNow,
  testGumroadNow,
} from "@/lib/integrations.functions";

export const Route = createFileRoute("/_authenticated/parametres/integrations")({
  validateSearch: (search: Record<string, unknown>) => ({
    pinterest: typeof search["pinterest"] === "string" ? (search["pinterest"] as string) : undefined,
    message: typeof search["message"] === "string" ? (search["message"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Intégrations Pinterest & Gumroad — AURIXEN" },
      {
        name: "description",
        content:
          "Connexion sécurisée des comptes Pinterest et Gumroad au centre de pilotage AURIXEN.",
      },
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
  const search = useSearch({ from: "/_authenticated/parametres/integrations" });
  const qc = useQueryClient();

  const fetchStatus = useServerFn(getIntegrations);
  const { data = [], isLoading } = useQuery({
    queryKey: ["integrations"],
    queryFn: () => fetchStatus(),
    refetchInterval: (q) =>
      (q.state.data ?? []).some((i) => i.status === "syncing") ? 3000 : false,
  });

  useEffect(() => {
    if (search.pinterest === "ok") toast.success(search.message ?? "Pinterest connecté");
    if (search.pinterest === "error") toast.error(search.message ?? "Échec de la connexion");
  }, [search.pinterest, search.message]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["integrations"] });
    qc.invalidateQueries({ queryKey: ["pins"] });
    qc.invalidateQueries({ queryKey: ["sales"] });
  };

  const connectPinterest = useMutation({
    mutationFn: useServerFn(startPinterestOAuth),
    onSuccess: (res) => {
      if (!res.url) {
        toast.error(`Secrets manquants : ${res.missing.join(", ")}`);
        return;
      }
      window.location.href = res.url;
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const syncPins = useMutation({
    mutationFn: useServerFn(syncPinterestNow),
    onSuccess: (r) => {
      toast.success(`${r.imported} pins synchronisés`);
      invalidate();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      invalidate();
    },
  });

  const testGumroad = useMutation({
    mutationFn: useServerFn(testGumroadNow),
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
    mutationFn: useServerFn(syncGumroadNow),
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
    mutationFn: (provider: "pinterest" | "gumroad") => disconnectFn({ data: { provider } }),
    onSuccess: () => {
      toast.success("Compte déconnecté");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pinterest = data.find((i) => i.provider === "pinterest");
  const gumroad = data.find((i) => i.provider === "gumroad");
  const busy =
    connectPinterest.isPending ||
    syncPins.isPending ||
    testGumroad.isPending ||
    syncSales.isPending ||
    disconnect.isPending;

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
          {/* Pinterest */}
          <section className="surface-panel p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-lg font-semibold">Pinterest</h3>
              <span className="text-xs">
                {STATUS_LABEL[pinterest?.status ?? "disconnected"]!.dot} Pinterest{" "}
                {STATUS_LABEL[pinterest?.status ?? "disconnected"]!.text}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Authentification officielle Pinterest (OAuth 2.0, API v5).
              {pinterest?.account_label ? ` Compte : @${pinterest.account_label}.` : ""}
              {pinterest?.last_sync_at
                ? ` Dernière synchro : ${new Date(pinterest.last_sync_at).toLocaleString("fr-FR")}.`
                : ""}
            </p>
            {pinterest && !pinterest.configured ? (
              <p className="mt-2 text-[11px] text-destructive">
                À renseigner dans les secrets : {pinterest.missing_secrets.join(", ")}
              </p>
            ) : null}
            {pinterest?.last_error ? (
              <p className="mt-2 text-[11px] text-destructive">{pinterest.last_error}</p>
            ) : null}
            <div className="mt-4 grid gap-2">
              <Button
                className="h-12 rounded-xl"
                disabled={busy || !pinterest?.configured}
                onClick={() => connectPinterest.mutate({})}
              >
                Connecter Pinterest
              </Button>
              <Button
                variant="secondary"
                className="h-12 rounded-xl"
                disabled={busy || pinterest?.status !== "connected"}
                onClick={() => syncPins.mutate({})}
              >
                <RefreshCw className={syncPins.isPending ? "size-4 animate-spin" : "size-4"} />
                Synchroniser maintenant
              </Button>
              <Button
                variant="ghost"
                className="h-12 rounded-xl text-muted-foreground"
                disabled={busy || !pinterest || pinterest.status === "disconnected"}
                onClick={() => disconnect.mutate("pinterest")}
              >
                Déconnecter
              </Button>
            </div>
          </section>

          {/* Gumroad */}
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
                onClick={() => testGumroad.mutate({})}
              >
                Tester la connexion
              </Button>
              <Button
                variant="secondary"
                className="h-12 rounded-xl"
                disabled={busy || gumroad?.status !== "connected"}
                onClick={() => syncSales.mutate({})}
              >
                <RefreshCw className={syncSales.isPending ? "size-4 animate-spin" : "size-4"} />
                Synchroniser maintenant
              </Button>
              <Button
                variant="ghost"
                className="h-12 rounded-xl text-muted-foreground"
                disabled={busy || !gumroad || gumroad.status === "disconnected"}
                onClick={() => disconnect.mutate("gumroad")}
              >
                Déconnecter
              </Button>
            </div>
          </section>
        </div>
      )}
    </Shell>
  );
}
