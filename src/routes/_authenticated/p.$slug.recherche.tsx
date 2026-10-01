import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { SectionTitle } from "@/components/aurixen/Shell";
import { Input } from "@/components/ui/input";
import { useEvents, useNotes } from "@/hooks/useAurixen";
import { useJournal, useTasks } from "@/hooks/useModuleData";
import { formatDate } from "@/lib/aurixen";

export const Route = createFileRoute("/_authenticated/p/$slug/recherche")({
  component: ProjectSearch,
});

function ProjectSearch() {
  const { slug } = Route.useParams();
  const [q, setQ] = useState("");
  const { data: notes = [] } = useNotes(slug);
  const { data: events = [] } = useEvents(slug);
  const { data: tasks = [] } = useTasks(slug);
  const { data: journal = [] } = useJournal(slug);

  const term = q.trim().toLowerCase();
  const match = (...v: (string | null | undefined)[]) =>
    v.some((s) => s?.toLowerCase().includes(term));

  const results = term
    ? [
        ...notes.filter((n) => match(n.title, n.content)).map((n) => ({ id: n.id, kind: "Note", title: n.title || "Sans titre", hint: n.content.slice(0, 80) })),
        ...events.filter((e) => match(e.title, e.description)).map((e) => ({ id: e.id, kind: "Événement", title: e.title, hint: formatDate(e.event_date) })),
        ...tasks.filter((t) => match(t.title, t.notes)).map((t) => ({ id: t.id, kind: "Tâche", title: t.title, hint: t.done ? "Terminée" : "À faire" })),
        ...journal.filter((j) => match(j.title, j.content)).map((j) => ({ id: j.id, kind: "Journal", title: j.title || "Sans titre", hint: formatDate(j.entry_date) })),
      ]
    : [];

  return (
    <section>
      <SectionTitle overline="Dans ce projet" title="Recherche" />
      <Input
        autoFocus
        className="mb-4 h-12"
        placeholder="Rechercher notes, tâches, journal, événements…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {term && results.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun résultat.</p>
      ) : (
        <ul className="space-y-2">
          {results.map((r) => (
            <li key={`${r.kind}-${r.id}`} className="surface-panel p-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-primary">{r.kind}</p>
              <p className="truncate text-sm font-medium">{r.title}</p>
              <p className="truncate text-xs text-muted-foreground">{r.hint}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
