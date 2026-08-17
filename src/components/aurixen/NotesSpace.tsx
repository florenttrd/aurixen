import { Check, Copy, Pencil, Pin, PinOff, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

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
import { useDeleteNote, useNotes, useSaveNote, type Note } from "@/hooks/useAurixen";
import { NOTE_CATEGORIES } from "@/lib/aurixen";
import { SectionTitle } from "./Shell";

type Draft = { id?: string; title: string; content: string; category: string; pinned?: boolean };

export function NotesSpace({ projectSlug, title }: { projectSlug: string; title: string }) {
  const { data: notes = [], isLoading } = useNotes(projectSlug);
  const save = useSaveNote(projectSlug);
  const remove = useDeleteNote(projectSlug);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [filter, setFilter] = useState("tous");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visible = useMemo(
    () => (filter === "tous" ? notes : notes.filter((n) => n.category === filter)),
    [notes, filter],
  );

  async function copyNote(note: Note) {
    try {
      await navigator.clipboard.writeText(note.content);
      setCopiedId(note.id);
      toast.success("Contenu copié");
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.error("Copie impossible");
    }
  }

  return (
    <section>
      <SectionTitle
        overline="Espace d'écriture"
        title={title}
        action={
          <Button
            size="sm"
            onClick={() => setDraft({ title: "", content: "", category: "idee" })}
            className="h-10 rounded-full"
          >
            <Plus className="size-4" /> Note
          </Button>
        }
      />

      <div className="-mx-4 mb-4 overflow-x-auto px-4">
        <div className="flex w-max gap-2">
          {[{ value: "tous", label: "Tout" }, ...NOTE_CATEGORIES].map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setFilter(c.value)}
              data-active={filter === c.value}
              className="h-9 rounded-full border border-border px-4 text-xs font-medium text-muted-foreground data-[active=true]:border-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : visible.length === 0 ? (
        <div className="surface-panel p-6 text-center text-sm text-muted-foreground">
          Aucune note ici. Écrivez votre première idée.
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((note) => (
            <li key={note.id} className="surface-panel p-4">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-[0.22em] text-primary">
                    {NOTE_CATEGORIES.find((c) => c.value === note.category)?.label ?? note.category}
                  </p>
                  <h3 className="truncate text-base font-semibold">{note.title || "Sans titre"}</h3>
                </div>
                <button
                  type="button"
                  aria-label={note.pinned ? "Retirer l'épingle" : "Épingler"}
                  onClick={() => save.mutate({ ...note, pinned: !note.pinned })}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
                >
                  {note.pinned ? (
                    <Pin className="size-4 text-primary" />
                  ) : (
                    <PinOff className="size-4" />
                  )}
                </button>
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {note.content.length > 320 ? `${note.content.slice(0, 320)}…` : note.content}
              </p>

              <div className="mt-3 flex gap-2">
                <Button
                  variant="secondary"
                  className="h-11 flex-1 rounded-xl"
                  onClick={() => copyNote(note)}
                >
                  {copiedId === note.id ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                  COPIER
                </Button>
                <Button
                  variant="outline"
                  aria-label="Modifier"
                  className="size-11 rounded-xl"
                  onClick={() => setDraft({ ...note })}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  aria-label="Supprimer"
                  className="size-11 rounded-xl text-destructive"
                  onClick={() => remove.mutate(note.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={draft !== null} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogContent className="top-4 translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
          <DialogHeader className="text-left">
            <DialogTitle>{draft?.id ? "Modifier la note" : "Nouvelle note"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-3">
              <Input
                placeholder="Titre"
                className="h-12"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <Select
                value={draft.category}
                onValueChange={(v) => setDraft({ ...draft, category: v })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Écrivez librement…"
                rows={10}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button
              className="h-12 w-full rounded-xl"
              onClick={() => {
                if (!draft) return;
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
