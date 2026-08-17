import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, FolderOpen, LineChart, Trophy } from "lucide-react";

import { LeoShell } from "@/components/aurixen/LeoShell";
import { SectionTitle, StatCard } from "@/components/aurixen/Shell";
import { usePins, useSales } from "@/hooks/useAurixen";
import { PRODUCTS, formatMoney, startOfMonth, withScores } from "@/lib/aurixen";

export const Route = createFileRoute("/_authenticated/leo/")({
  component: LeoDashboard,
});

function LeoDashboard() {
  const { data: pins = [] } = usePins();
  const { data: sales = [] } = useSales();

  const scored = withScores(pins);
  const top = [...scored].sort((a, b) => b.score - a.score).slice(0, 3);
  const monthStart = startOfMonth().toISOString();
  const monthRevenue = sales
    .filter((s) => s.sold_at >= monthStart)
    .reduce((sum, s) => sum + Number(s.amount), 0);
  const revenue = sales.reduce((sum, s) => sum + Number(s.amount), 0);
  const impressions = pins.reduce((s, p) => s + p.impressions, 0);
  const saves = pins.reduce((s, p) => s + p.saves, 0);

  const bestProduct = PRODUCTS.map((product) => ({
    product,
    total: sales.filter((s) => s.product === product).reduce((sum, s) => sum + Number(s.amount), 0),
  })).sort((a, b) => b.total - a.total)[0];

  return (
    <LeoShell subtitle="Centre de contrôle">
      <section className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Cognitive advantage</p>
        <h1 className="mt-2 text-3xl font-semibold leading-[1.05]">
          Un secret que le futur
          <br />
          <span className="gradient-text">connaît déjà.</span>
        </h1>
        <div className="hairline mt-5 h-px" />
      </section>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Revenus mois" value={formatMoney(monthRevenue)} hint="Ventes du mois" />
        <StatCard label="Revenus total" value={formatMoney(revenue)} hint={`${sales.length} ventes`} />
        <StatCard label="Impressions" value={impressions.toLocaleString("fr-FR")} hint="Pinterest" />
        <StatCard label="Enregistrements" value={saves.toLocaleString("fr-FR")} hint="Total pins" />
      </div>

      {bestProduct && bestProduct.total > 0 ? (
        <div className="surface-panel mt-3 p-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Produit le plus performant
          </p>
          <p className="mt-1 text-xl font-semibold">{bestProduct.product}</p>
          <p className="text-xs text-muted-foreground">{formatMoney(bestProduct.total)} générés</p>
        </div>
      ) : null}

      <section className="mt-8">
        <SectionTitle overline="Accès rapide" title="Modules" />
        <ul className="grid grid-cols-1 gap-3">
          {[
            {
              to: "/leo/analytics",
              label: "Analytics Pinterest",
              hint: "Portée, clics, engagement",
              icon: <LineChart className="size-5" />,
            },
            {
              to: "/leo/classement",
              label: "Classement des pins",
              hint: "TOP 5 semaine · TOP 1 mois",
              icon: <Trophy className="size-5" />,
            },
            {
              to: "/leo/fichiers",
              label: "Fichiers",
              hint: "Documents, visuels, exports",
              icon: <FolderOpen className="size-5" />,
            },
          ].map((m) => (
            <li key={m.to}>
              <Link
                to={m.to}
                className="surface-panel flex items-center gap-3 p-4 active:opacity-90"
              >
                <span className="text-primary">{m.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{m.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{m.hint}</span>
                </span>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <SectionTitle overline="Performance" title="Meilleurs pins" />
        {top.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun pin encore enregistré dans la bibliothèque.
          </p>
        ) : (
          <ul className="space-y-2">
            {top.map((p, i) => (
              <li key={p.id} className="surface-panel flex items-center gap-3 p-3">
                <span className="w-6 text-center text-lg font-bold text-primary">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {p.product ?? "Sans produit"}
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums">{p.score}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </LeoShell>
  );
}
