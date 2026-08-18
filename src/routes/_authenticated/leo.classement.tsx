import { createFileRoute } from "@tanstack/react-router";
import { Crown, Medal } from "lucide-react";
import { useMemo } from "react";

import { LeoShell } from "@/components/aurixen/LeoShell";
import { SectionTitle } from "@/components/aurixen/Shell";
import { usePins } from "@/hooks/useAurixen";
import { formatDate, startOfMonth, startOfWeek, toISODate, withScores } from "@/lib/aurixen";

export const Route = createFileRoute("/_authenticated/leo/classement")({
  component: RankingPage,
});

function RankingPage() {
  const { data: pins = [] } = usePins();

  const { all, week, month } = useMemo(() => {
    const scored = [...withScores(pins)].sort((a, b) => b.score - a.score);
    const weekIso = toISODate(startOfWeek());
    const monthIso = toISODate(startOfMonth());
    return {
      all: scored,
      week: scored.filter((p) => (p.published_at ?? "") >= weekIso).slice(0, 5),
      month: scored.filter((p) => (p.published_at ?? "") >= monthIso).slice(0, 1),
    };
  }, [pins]);

  return (
    <LeoShell subtitle="Classement des pins">
      <SectionTitle overline="Ce qui fonctionne" title="Classements" />

      <section className="surface-panel mb-6 p-4">
        <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-primary">
          <Crown className="size-3.5" /> TOP 1 du mois
        </p>
        {month[0] ? (
          <div className="mt-3 flex items-center gap-3">
            {month[0].image_url ? (
              <img
                src={month[0].image_url}
                alt={month[0].title}
                className="size-16 rounded-xl object-cover"
              />
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold">{month[0].title}</p>
              <p className="text-xs text-muted-foreground">
                {month[0].product ?? "Sans produit"} · score {month[0].score}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            Aucun pin publié ce mois-ci pour l'instant.
          </p>
        )}
      </section>

      <section className="mb-6">
        <p className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-primary">
          <Medal className="size-3.5" /> TOP 5 de la semaine
        </p>
        {week.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun pin publié cette semaine.</p>
        ) : (
          <ul className="space-y-2">
            {week.map((p, i) => (
              <li key={p.id} className="surface-panel flex items-center gap-3 p-3">
                <span className="w-5 text-center text-sm font-bold text-primary">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatDate(p.published_at)}
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums">{p.score}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          Classement général
        </p>
        {all.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun pin enregistré.</p>
        ) : (
          <ul className="space-y-2">
            {all.map((p, i) => (
              <li key={p.id} className="surface-panel flex items-center gap-3 p-3">
                <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {p.product ?? "Sans produit"} ·{" "}
                    {p.status === "publie" ? "publié" : "créé"}
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
