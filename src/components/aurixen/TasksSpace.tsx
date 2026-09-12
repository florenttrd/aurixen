import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { SectionTitle } from "./Shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useDeleteTask, useSaveTask, useTasks } from "@/hooks/useModuleData";
import { formatDate, toISODate } from "@/lib/aurixen";
import { cn } from "@/lib/utils";

export function TasksSpace({ projectSlug, title = "Tâches" }: { projectSlug: string; title?: string }) {
  const { data: tasks = [], isLoading } = useTasks(projectSlug);
  const save = useSaveTask(projectSlug);
  const remove = useDeleteTask(projectSlug);
  const [draft, setDraft] = useState("");
  const [due, setDue] = useState("");

  function add() {
    if (!draft.trim()) return;
    save.mutate({ title: draft.trim(), due_date: due || null });
    setDraft("");
    setDue("");
  }

  const today = toISODate(new Date());
  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <section>
      <SectionTitle overline="À faire" title={title} />

      <div className="surface-panel mb-4 space-y-2 p-3">
        <Input
          className="h-12"
          placeholder="Nouvelle tâche"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
        />
        <div className="flex gap-2">
          <Input
            type="date"
            className="h-12 flex-1"
            value={due}
            onChange={(e) => setDue(e.target.value)}
          />
          <Button className="h-12 rounded-xl px-5" onClick={add}>
            <Plus className="size-4" /> Ajouter
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : tasks.length === 0 ? (
        <p className="surface-panel p-5 text-sm text-muted-foreground">Aucune tâche pour l'instant.</p>
      ) : (
        <ul className="space-y-2">
          {[...open, ...done].map((task) => (
            <li key={task.id} className="surface-panel flex items-center gap-3 p-3">
              <Checkbox
                checked={task.done}
                onCheckedChange={(v) => save.mutate({ id: task.id, ...task, done: Boolean(v) })}
                aria-label="Terminer la tâche"
                className="size-6"
              />
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-sm font-medium",
                    task.done && "text-muted-foreground line-through",
                  )}
                >
                  {task.title}
                </span>
                {task.due_date ? (
                  <span
                    className={cn(
                      "block text-[11px]",
                      !task.done && task.due_date < today
                        ? "text-destructive"
                        : "text-muted-foreground",
                    )}
                  >
                    Échéance {formatDate(task.due_date)}
                  </span>
                ) : null}
              </span>
              <button
                type="button"
                aria-label="Supprimer la tâche"
                onClick={() => remove.mutate(task.id)}
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-destructive active:bg-muted"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
