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
  useDeleteModuleRecord,
  useModuleRecords,
  useSaveModuleRecord,
  type ModuleRecord,
} from "@/hooks/useModuleData";
import type { ModuleField } from "@/lib/modules";

type Draft = { id?: string; title: string; data: Record<string, string> };

const INPUT_TYPE: Record<ModuleField["type"], string> = {
  texte: "text",
  nombre: "number",
  montant: "number",
  date: "date",
  email: "email",
  telephone: "tel",
  long: "text",
  statut: "text",
};

/**
 * Generic space rendering the records of a specialised or custom module,
 * driven by the module's field definition. This is the seed of the future
 * module builder: new modules need no new table and no new route.
 */
export function RecordsSpace({
  projectSlug,
  moduleKey,
  label,
  fields,
}: {
  projectSlug: string;
  moduleKey: string;
  label: string;
  fields: ModuleField[];
}) {
  const { data: records = [], isLoading } = useModuleRecords(projectSlug, moduleKey);
  const save = useSaveModuleRecord(projectSlug, moduleKey);
  const remove = useDeleteModuleRecord(projectSlug, moduleKey);
  const [draft, setDraft] = useState<Draft | null>(null);

  function open(record?: ModuleRecord) {
    setDraft(
      record
        ? { id: record.id, title: record.title, data: { ...record.data } }
        : { title: "", data: {} },
    );
  }

  return (
    <section>
      <SectionTitle
        overline="Module"
        title={label}
        action={
          <Button size="sm" className="h-10 rounded-xl" onClick={() => open()}>
            <Plus className="size-4" /> Fiche
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : records.length === 0 ? (
        <p className="surface-panel p-5 text-sm text-muted-foreground">
          Aucune fiche dans « {label} ». Ajoutez la première avec le bouton ci-dessus.
        </p>
      ) : (
        <ul className="space-y-3">
          {records.map((record) => (
            <li key={record.id} className="surface-panel p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">
                    {record.title || "Sans titre"}
                  </p>
                  <dl className="mt-2 space-y-1">
                    {fields
                      .filter((f) => record.data[f.key])
                      .map((f) => (
                        <div key={f.key} className="flex gap-2 text-xs">
                          <dt className="shrink-0 text-muted-foreground">{f.label}</dt>
                          <dd className="min-w-0 flex-1 truncate">{record.data[f.key]}</dd>
                        </div>
                      ))}
                  </dl>
                </div>
                <button
                  type="button"
                  aria-label="Modifier la fiche"
                  onClick={() => open(record)}
                  className="flex size-9 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Supprimer la fiche"
                  onClick={() => remove.mutate(record.id)}
                  className="flex size-9 items-center justify-center rounded-full text-destructive active:bg-muted"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={draft !== null} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-y-auto">
          <DialogHeader className="text-left">
            <DialogTitle>{draft?.id ? "Modifier la fiche" : `Nouvelle fiche — ${label}`}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-3">
              <Input
                className="h-12"
                placeholder="Nom"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              {fields.map((field) =>
                field.type === "long" ? (
                  <Textarea
                    key={field.key}
                    rows={4}
                    placeholder={field.label}
                    value={draft.data[field.key] ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, data: { ...draft.data, [field.key]: e.target.value } })
                    }
                  />
                ) : (
                  <Input
                    key={field.key}
                    className="h-12"
                    type={INPUT_TYPE[field.type]}
                    placeholder={field.label}
                    value={draft.data[field.key] ?? ""}
                    onChange={(e) =>
                      setDraft({ ...draft, data: { ...draft.data, [field.key]: e.target.value } })
                    }
                  />
                ),
              )}
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
