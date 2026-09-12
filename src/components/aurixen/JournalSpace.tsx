import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { SectionTitle } from "./Shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useDeleteJournalEntry,
  useJournal,
  useSaveJournalEntry,
  type JournalEntry,
} from "@/hooks/useModuleData";
import { formatDate, toISODate } from "@/lib/aurixen";

type Draft = { id?: string; entry_date: string; title: string; content: string };

export function JournalSpace({
  projectSlug,
  title = "Journal de bord",
}: {
  projectSlug: string;
  title?: string;
}) {
  const { data: entries = [], isLoading } = useJournal(projectSlug);
  const save = useSaveJournalEntry(projectSlug);
  const remove = useDeleteJournalEntry(projectSlug);
  const [draft, setDraft] = useState<Draft | null>(null);

  function open(entry?: JournalEntry) {
    setDraft(
      entry
        ? {
            id: entry.id,
            entry_date: entry.entry_date,
            title: entry.title,
            content: entry.content,
          }
        : { entry_date: toISODate(new Date()), title: "", content: "" },
    );
  }

  return (
    <section>
      <SectionTitle
        overline="Mémoire du projet"
        title={title}
        action={
          <Button size="sm" className="h-10 rounded-xl" onClick={() => open()}>
            <Plus className="size-4" /> Entrée
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : entries.length === 0 ? (
        <p className="surface-panel p-5 text-sm text-muted-foreground">
          Le journal est vide. Notez ce que vous avez fait, décidé ou appris.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="surface-panel p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-primary">
                    {formatDate(entry.entry_date)}
                  </p>
                  <p className="mt-1 truncate text-base font-semibold">
                    {entry.title || "Sans titre"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Modifier l'entrée"
                  onClick={() => open(entry)}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Supprimer l'entrée"
                  onClick={() => remove.mutate(entry.id)}
                  className="flex size-9 items-center justify-center rounded-full text-destructive active:bg-muted"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              {entry.content ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                  {entry.content}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={draft !== null} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-y-auto">
          <DialogHeader className="text-left">
            <DialogTitle>{draft?.id ? "Modifier l'entrée" : "Nouvelle entrée"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-3">
              <Input
                type="date"
                className="h-12"
                value={draft.entry_date}
                onChange={(e) => setDraft({ ...draft, entry_date: e.target.value })}
              />
              <Input
                className="h-12"
                placeholder="Titre"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <Textarea
                rows={6}
                className="min-h-32"
                placeholder="Ce qui s'est passé, décisions, apprentissages…"
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              />
            </div>
          ) : null}
          <DialogFooter className="shrink-0">
            <Button
              className="h-12 w-full rounded-xl"
              onClick={() => {
                if (!draft) return;
                save.mutate(draft);
                setDraft(null);
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
