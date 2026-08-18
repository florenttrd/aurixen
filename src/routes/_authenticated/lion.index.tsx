import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, CalendarDays, NotebookPen, Store } from "lucide-react";
import { useMemo } from "react";

import { LionShell } from "@/components/aurixen/LionShell";
import { SectionTitle, StatCard } from "@/components/aurixen/Shell";
import { useAvailabilities, useEvents, useRestaurants } from "@/hooks/useAurixen";
import { formatDate, toISODate } from "@/lib/aurixen";

export const Route = createFileRoute("/_authenticated/lion/")({
  component: LionDashboard,
});

function LionDashboard() {
  const { data: restaurants = [] } = useRestaurants();
  const { data: availabilities = [] } = useAvailabilities();
  const { data: events = [] } = useEvents("danse-du-lion");

  const today = toISODate(new Date());
  const upcoming = useMemo(
    () =>
      availabilities
        .filter((a) => a.slot_date >= today)
        .sort((a, b) => a.slot_date.localeCompare(b.slot_date))
        .slice(0, 4)
        .map((a) => ({
          ...a,
          restaurant: restaurants.find((r) => r.id === a.restaurant_id)?.name ?? "Restaurant",
        })),
    [availabilities, restaurants, today],
  );

  const interested = restaurants.filter((r) => r.interest === "eleve").length;

  return (
    <LionShell subtitle="Centre de contrôle">
      <section className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">舞獅 · 新年快樂</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight">
          Danse du Lion
          <br />
          <span className="gradient-text">Prestations & restaurants</span>
        </h1>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Restaurants" value={String(restaurants.length)} hint="Base de données" />
        <StatCard label="Intérêt élevé" value={String(interested)} hint="Prospects chauds" />
        <StatCard label="Disponibilités" value={String(availabilities.length)} hint="Créneaux" />
        <StatCard label="Événements" value={String(events.length)} hint="Planifiés" />
      </div>

      <section className="mt-8">
        <SectionTitle overline="Accès rapide" title="Modules" />
        <ul className="space-y-3">
          {[
            {
              to: "/lion/restaurants",
              label: "Restaurants",
              hint: "Fiches, contacts, disponibilités",
              icon: <Store className="size-5" />,
            },
            {
              to: "/lion/calendrier",
              label: "Calendrier",
              hint: "Date → heure → restaurant",
              icon: <CalendarDays className="size-5" />,
            },
            {
              to: "/lion/notes",
              label: "Espace d'écriture",
              hint: "Idées, stratégies, observations",
              icon: <NotebookPen className="size-5" />,
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
        <SectionTitle overline="À venir" title="Prochains créneaux" />
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun créneau enregistré.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((a) => (
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
                <span className="text-[11px] uppercase tracking-wide text-primary">{a.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </LionShell>
  );
}
