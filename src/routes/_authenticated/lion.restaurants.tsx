import { createFileRoute } from "@tanstack/react-router";
import { Phone, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { LionShell } from "@/components/aurixen/LionShell";
import { SectionTitle } from "@/components/aurixen/Shell";
import { RestaurantSheet } from "@/components/aurixen/RestaurantSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDeleteRestaurant, useRestaurants, type Restaurant } from "@/hooks/useAurixen";
import { INTEREST_LEVELS } from "@/lib/aurixen";

export const Route = createFileRoute("/_authenticated/lion/restaurants")({
  component: RestaurantsPage,
});

function RestaurantsPage() {
  const { data: restaurants = [], isLoading } = useRestaurants();
  const remove = useDeleteRestaurant();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Restaurant | "new" | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((r) =>
      [r.name, r.location, r.address, r.cuisine, r.notes]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [restaurants, query]);

  return (
    <LionShell subtitle="Restaurants">
      <SectionTitle
        overline="Base de données"
        title="Restaurants"
        action={
          <Button size="sm" className="h-10 rounded-full" onClick={() => setOpen("new")}>
            <Plus className="size-4" /> Fiche
          </Button>
        }
      />

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-12 pl-10"
          placeholder="Rechercher un restaurant"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : visible.length === 0 ? (
        <div className="surface-panel p-6 text-center text-sm text-muted-foreground">
          Aucun restaurant. Créez votre première fiche.
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((r) => {
            const level = INTEREST_LEVELS.find((l) => l.value === r.interest);
            return (
              <li key={r.id} className="surface-panel p-4">
                <button
                  type="button"
                  onClick={() => setOpen(r)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold">{r.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[r.location, r.cuisine].filter(Boolean).join(" · ") || "Restaurant chinois"}
                    </span>
                  </span>
                  <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {level?.label ?? r.interest}
                  </span>
                </button>
                <div className="mt-3 flex items-center gap-2">
                  {r.phone ? (
                    <a
                      href={`tel:${r.phone}`}
                      className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-border text-xs font-medium"
                    >
                      <Phone className="size-3.5" /> Appeler
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setOpen(r)}
                    className="h-10 flex-1 rounded-xl border border-border text-xs font-medium"
                  >
                    Ouvrir la fiche
                  </button>
                  <button
                    type="button"
                    aria-label="Supprimer le restaurant"
                    onClick={() => remove.mutate(r.id)}
                    className="grid size-10 place-items-center rounded-xl text-destructive active:bg-muted"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <RestaurantSheet
        value={open}
        onClose={() => setOpen(null)}
      />
    </LionShell>
  );
}
