import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { useMemo } from "react";

import { LeoShell } from "@/components/aurixen/LeoShell";
import { SectionTitle, StatCard } from "@/components/aurixen/Shell";
import { usePins } from "@/hooks/useAurixen";
import { PRODUCTS, withScores } from "@/lib/aurixen";

export const Route = createFileRoute("/_authenticated/leo/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: pins = [] } = usePins();

  const totals = useMemo(() => {
    const impressions = pins.reduce((s, p) => s + p.impressions, 0);
    const saves = pins.reduce((s, p) => s + p.saves, 0);
    const clicks = pins.reduce((s, p) => s + p.clicks, 0);
    const outbound = pins.reduce((s, p) => s + p.outbound_clicks, 0);
    return {
      impressions,
      saves,
      clicks,
      outbound,
      saveRate: impressions ? (saves / impressions) * 100 : 0,
      ctr: impressions ? (outbound / impressions) * 100 : 0,
    };
  }, [pins]);

  const byProduct = useMemo(() => {
    const rows = PRODUCTS.map((product) => {
      const list = pins.filter((p) => p.product === product);
      return {
        product,
        impressions: list.reduce((s, p) => s + p.impressions, 0),
        saves: list.reduce((s, p) => s + p.saves, 0),
        outbound: list.reduce((s, p) => s + p.outbound_clicks, 0),
      };
    });
    const max = Math.max(1, ...rows.map((r) => r.impressions));
    return { rows, max };
  }, [pins]);

  const best = useMemo(
    () => [...withScores(pins)].sort((a, b) => b.score - a.score).slice(0, 5),
    [pins],
  );

  return (
    <LeoShell subtitle="Analytics Pinterest">
      <SectionTitle overline="Performance du compte" title="Analytics" />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Impressions" value={totals.impressions.toLocaleString("fr-FR")} />
        <StatCard label="Enregistrements" value={totals.saves.toLocaleString("fr-FR")} />
        <StatCard label="Clics" value={totals.clicks.toLocaleString("fr-FR")} />
        <StatCard label="Clics sortants" value={totals.outbound.toLocaleString("fr-FR")} />
        <StatCard label="Taux d'enregistrement" value={`${totals.saveRate.toFixed(2)} %`} />
        <StatCard label="CTR sortant" value={`${totals.ctr.toFixed(2)} %`} />
      </div>

      <div className="surface-panel mt-4 flex gap-3 p-4 text-xs text-muted-foreground">
        <Info className="size-4 shrink-0 text-primary" />
        <p>
          Ces indicateurs proviennent des données saisies dans la bibliothèque de pins. La connexion
          à l'API officielle Pinterest sera branchée dans une étape suivante, sans jamais stocker de
          mot de passe.
        </p>
      </div>

      <section className="mt-6">
        <SectionTitle overline="Comparaison" title="Portée par produit" />
        <ul className="space-y-2">
          {byProduct.rows.map((r) => (
            <li key={r.product} className="surface-panel p-3">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{r.product}</span>
                <span className="tabular-nums">{r.impressions.toLocaleString("fr-FR")}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(r.impressions / byProduct.max) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {r.saves} enregistrements · {r.outbound} clics sortants
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <SectionTitle overline="Top contenus" title="Pins les plus performants" />
        {best.length === 0 ? (
          <p className="text-sm text-muted-foreground">Pas encore de données.</p>
        ) : (
          <ul className="space-y-2">
            {best.map((p, i) => (
              <li key={p.id} className="surface-panel flex items-center gap-3 p-3">
                <span className="w-5 text-center text-sm font-bold text-primary">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.title}</span>
                <span className="text-sm font-semibold tabular-nums">{p.score}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </LeoShell>
  );
}
