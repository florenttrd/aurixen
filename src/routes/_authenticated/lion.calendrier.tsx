import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

import { CalendarBoard } from "@/components/aurixen/CalendarBoard";
import { LionShell } from "@/components/aurixen/LionShell";
import { SectionTitle } from "@/components/aurixen/Shell";
import { useAvailabilities, useRestaurants } from "@/hooks/useAurixen";
import { formatDate, toISODate } from "@/lib/aurixen";

export const Route = createFileRoute("/_authenticated/lion/calendrier")({
  component: LionCalendar,
});

function LionCalendar() {
  const { data: availabilities = [] } = useAvailabilities();
  const { data: restaurants = [] } = useRestaurants();

  const rows = useMemo(() => {
    const today = toISODate(new Date());
    const names = new Map(restaurants.map((r) => [r.id, r.name]));
    return availabilities
      .filter((a) => a.slot_date >= today)
      .sort((a, b) => a.slot_date.localeCompare(b.slot_date))
      .map((a) => ({ ...a, restaurant: names.get(a.restaurant_id) ?? "Restaurant" }));
  }, [availabilities, restaurants]);

  return (
    <LionShell subtitle="Calendrier">
      <CalendarBoard
        projectSlug="danse-du-lion"
        overline="Prestations"
        title="Calendrier Danse du Lion"
      />

      <section className="mt-8">
        <SectionTitle overline="Date → Heure → Restaurant" title="Disponibilités à venir" />
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune disponibilité enregistrée. Ajoutez-en depuis une fiche restaurant.
          </p>
        ) : (
          <ul className="space-y-2">
            {rows.map((a) => (
              <li key={a.id} className="surface-panel flex items-center gap-3 p-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">
                    {formatDate(a.slot_date)}
                    {a.slot_time ? ` · ${a.slot_time.slice(0, 5)}` : ""}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {a.restaurant}
                  </span>
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    backgroundColor:
                      a.status === "disponible"
                        ? "color-mix(in oklab, var(--success) 22%, transparent)"
                        : a.status === "reserve"
                          ? "color-mix(in oklab, var(--primary) 22%, transparent)"
                          : "color-mix(in oklab, var(--destructive) 22%, transparent)",
                    color:
                      a.status === "disponible"
                        ? "var(--success)"
                        : a.status === "reserve"
                          ? "var(--primary)"
                          : "var(--destructive)",
                  }}
                >
                  {a.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </LionShell>
  );
}
