import { Link } from "@tanstack/react-router";
import { Pencil, Plus, Shapes, Trash2 } from "lucide-react";
import { useState } from "react";

import { SectionTitle } from "./Shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useCanvases,
  useCreateCanvas,
  useDeleteCanvas,
  useRenameCanvas,
  type CanvasRow,
} from "@/hooks/useCanvases";
import { formatDate } from "@/lib/aurixen";

export function CanvasList({ projectSlug }: { projectSlug: string }) {
  const { data: canvases = [], isLoading } = useCanvases(projectSlug);
  const create = useCreateCanvas(projectSlug);
  const rename = useRenameCanvas(projectSlug);
  const remove = useDeleteCanvas(projectSlug);
  const [naming, setNaming] = useState<{ id?: string; name: string } | null>(null);
  const [toDelete, setToDelete] = useState<CanvasRow | null>(null);
  const [typed, setTyped] = useState("");

  async function submitName() {
    if (!naming) return;
    if (naming.id) await rename.mutateAsync({ id: naming.id, name: naming.name.trim() || "Sans titre" });
    else await create.mutateAsync(naming.name);
    setNaming(null);
  }

  return (
    <section>
      <SectionTitle
        overline="Pensée spatiale"
        title="Canvas"
        action={
          <Button size="sm" className="h-10 rounded-xl" onClick={() => setNaming({ name: "" })}>
            <Plus className="size-4" /> Canvas
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : canvases.length === 0 ? (
        <div className="surface-panel p-5 text-sm text-muted-foreground">
          Aucun canvas. Créez-en un pour poser librement notes, images, dessins et connexions sur une
          surface infinie.
        </div>
      ) : (
        <ul className="space-y-3">
          {canvases.map((c) => {
            const count = (c.elements ?? []).filter((e) => !(e as { isDeleted?: boolean }).isDeleted).length;
            return (
              <li key={c.id} className="surface-panel flex items-center gap-2 p-3">
                <Link
                  to="/canvas/$canvasId"
                  params={{ canvasId: c.id }}
                  className="flex min-h-12 min-w-0 flex-1 items-center gap-3 active:opacity-90"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Shapes className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-semibold">{c.name}</span>
                    <span className="block text-[11px] text-muted-foreground">
                      {count} objet{count > 1 ? "s" : ""} · modifié le {formatDate(c.updated_at.slice(0, 10))}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  aria-label="Renommer le canvas"
                  onClick={() => setNaming({ id: c.id, name: c.name })}
                  className="flex size-10 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Supprimer le canvas"
                  onClick={() => {
                    setTyped("");
                    setToDelete(c);
                  }}
                  className="flex size-10 items-center justify-center rounded-full text-destructive active:bg-muted"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={naming !== null} onOpenChange={(v) => !v && setNaming(null)}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>{naming?.id ? "Renommer le canvas" : "Nouveau canvas"}</DialogTitle>
          </DialogHeader>
          <Input
            autoFocus
            className="h-12"
            placeholder="Ex. Brainstorming produit B-1"
            value={naming?.name ?? ""}
            onChange={(e) => naming && setNaming({ ...naming, name: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && submitName()}
          />
          <DialogFooter>
            <Button className="h-12 w-full rounded-xl" onClick={submitName}>
              {naming?.id ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={toDelete !== null} onOpenChange={(v) => !v && setToDelete(null)}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>Supprimer « {toDelete?.name} »</DialogTitle>
            <DialogDescription>
              Tout le contenu de ce canvas sera effacé définitivement. Recopiez <strong>SUPPRIMER</strong> pour confirmer.
            </DialogDescription>
          </DialogHeader>
          <Input className="h-12" placeholder="SUPPRIMER" value={typed} onChange={(e) => setTyped(e.target.value)} />
          <DialogFooter>
            <Button
              variant="destructive"
              className="h-12 w-full rounded-xl"
              disabled={typed !== "SUPPRIMER" || remove.isPending}
              onClick={async () => {
                if (!toDelete) return;
                await remove.mutateAsync({ id: toDelete.id });
                setToDelete(null);
              }}
            >
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
