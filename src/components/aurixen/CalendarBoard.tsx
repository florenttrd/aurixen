import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteEvent,
  useEvents,
  useSaveEvent,
  type CalendarEvent,
} from "@/hooks/useAurixen";
import { MONTH_NAMES, PROJECT_LABELS, PROJECTS, monthMatrix, toISODate } from "@/lib/aurixen";
import { SectionTitle } from "./Shell";

type Draft = Partial<CalendarEvent> & { event_date: string };

const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

export function CalendarBoard({
  projectSlug,
  title,
  overline,
  allowProjectChoice = false,
}: {
  projectSlug?: string;
  title: string;
  overline?: string;
  allowProjectChoice?: boolean;
}) {
  const { data: events = [] } = useEvents(projectSlug);
  const save = useSaveEvent(projectSlug);
  const remove = useDeleteEvent();

  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<string>(toISODate(today));
  const [draft, setDraft] = useState<Draft | null>(null);

  const days = useMemo(() => monthMatrix(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const list = map.get(e.event_date) ?? [];
      list.push(e);
      map.set(e.event_date, list);
    }
    return map;
  }, [events]);

  const dayEvents = (byDate.get(selected) ?? []).slice().sort((a, b) => {
    return (a.event_time ?? "99").localeCompare(b.event_time ?? "99");
  });

  function shift(delta: number) {
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  }

  return (
    <section>
      <SectionTitle
        overline={overline ?? "Calendrier"}
        title={title}
        action={
          <Button
            size="sm"
            className="h-10 rounded-full"
            onClick={() =>
              setDraft({
                event_date: selected,
                title: "",
                project_slug: projectSlug ?? "aurixen",
              })
            }
          >
            <Plus className="size-4" /> Événement
          </Button>
        }
      />

      <div className="surface-panel p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            aria-label="Mois précédent"
            onClick={() => shift(-1)}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
          >
            <ChevronLeft className="size-5" />
          </button>
          <p className="text-sm font-semibold uppercase tracking-[0.2em]">
            {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
          </p>
          <button
            type="button"
            aria-label="Mois suivant"
            onClick={() => shift(1)}
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-muted-foreground">
          {DAY_LABELS.map((d, i) => (
            <span key={`${d}-${i}`}>{d}</span>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            if (!day) return <span key={`empty-${i}`} className="aspect-square" />;
            const iso = toISODate(day);
            const list = byDate.get(iso) ?? [];
            const isToday = iso === toISODate(today);
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setSelected(iso)}
                data-selected={iso === selected}
                className="relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm tabular-nums data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
              >
                <span className={isToday ? "font-bold text-primary" : undefined}>
                  {day.getDate()}
                </span>
                {list.length ? (
                  <span className="mt-0.5 flex gap-0.5">
                    {list.slice(0, 3).map((e) => (
                      <span
                        key={e.id}
                        className="size-1 rounded-full"
                        style={{
                          backgroundColor:
                            PROJECTS.find((p) => p.slug === e.project_slug)?.swatch ?? "#c9a84c",
                        }}
                      />
                    ))}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {new Date(`${selected}T12:00:00`).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        {dayEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun événement ce jour.</p>
        ) : (
          dayEvents.map((e) => (
            <div key={e.id} className="surface-panel flex items-start gap-3 p-3">
              <span
                className="mt-1.5 size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    PROJECTS.find((p) => p.slug === e.project_slug)?.swatch ?? "#c9a84c",
                }}
              />
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => setDraft({ ...e })}
              >
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {e.event_time ? e.event_time.slice(0, 5) : "Toute la journée"} ·{" "}
                  {PROJECT_LABELS[e.project_slug] ?? e.project_slug}
                </p>
                {e.description ? (
                  <p className="mt-1 text-xs text-muted-foreground">{e.description}</p>
                ) : null}
              </button>
              <button
                type="button"
                aria-label="Supprimer l'événement"
                onClick={() => remove.mutate(e.id)}
                className="flex size-9 items-center justify-center rounded-full text-destructive active:bg-muted"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <Dialog open={draft !== null} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogContent className="top-4 translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
          <DialogHeader className="text-left">
            <DialogTitle>{draft?.id ? "Modifier l'événement" : "Nouvel événement"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-3">
              <Input
                className="h-12"
                placeholder="Titre"
                value={draft.title ?? ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <div className="flex gap-2">
                <Input
                  type="date"
                  className="h-12"
                  value={draft.event_date}
                  onChange={(e) => setDraft({ ...draft, event_date: e.target.value })}
                />
                <Input
                  type="time"
                  className="h-12"
                  value={draft.event_time?.slice(0, 5) ?? ""}
                  onChange={(e) => setDraft({ ...draft, event_time: e.target.value })}
                />
              </div>
              {allowProjectChoice ? (
                <Select
                  value={draft.project_slug ?? "aurixen"}
                  onValueChange={(v) => setDraft({ ...draft, project_slug: v })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aurixen">Aurixen (général)</SelectItem>
                    {PROJECTS.map((p) => (
                      <SelectItem key={p.slug} value={p.slug}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
              <Textarea
                rows={4}
                placeholder="Description (optionnel)"
                value={draft.description ?? ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button
              className="h-12 w-full rounded-xl"
              onClick={() => {
                if (!draft?.event_date) return;
                save.mutate(draft, { onSuccess: () => setDraft(null) });
              }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
