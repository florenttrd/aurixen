import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, Folder, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useConnectedObjects,
  useConnectorsStatus,
  useProjectConnectors,
  useSaveProjectConnector,
  type ProjectConnector,
} from "@/hooks/useConnectors";
import {
  CONNECTORS,
  CONNECTOR_CATEGORIES,
  STATUS_UI,
  type ConnectorDef,
  type ConnectorStatusDTO,
} from "@/lib/connectors";
import { driveAddReferenceFn, driveListFn, purgeConnectorDataFn, syncConnectorNow } from "@/lib/connectors.functions";

export function statusOf(def: ConnectorDef, s?: ConnectorStatusDTO) {
  if (def.availability === "soon") return STATUS_UI.soon;
  return STATUS_UI[s?.status ?? "not_connected"];
}

export function ProjectConnectors({ projectSlug }: { projectSlug: string }) {
  const { data: status = [] } = useConnectorsStatus();
  const { data: links = [] } = useProjectConnectors(projectSlug);
  const save = useSaveProjectConnector();
  const [open, setOpen] = useState<ConnectorDef | null>(null);

  const linked = CONNECTORS.filter((c) => links.some((l) => l.connector_id === c.id));
  const available = CONNECTORS.filter((c) => !links.some((l) => l.connector_id === c.id));

  return (
    <div className="space-y-6">
      <section>
        <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Connectés à ce projet</p>
        {linked.length === 0 ? (
          <p className="surface-panel p-4 text-sm text-muted-foreground">Aucun connecteur pour l'instant.</p>
        ) : (
          <ul className="space-y-2">
            {linked.map((c) => {
              const s = status.find((x) => x.connector_id === c.id);
              const ui = statusOf(c, s);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setOpen(c)}
                    className="surface-panel flex w-full items-center gap-3 p-3 text-left active:opacity-90"
                  >
                    <span className="text-xl">{c.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{c.name}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {ui.dot} {ui.label}
                        {s?.account_label ? ` · ${s.account_label}` : ""}
                        {s?.last_sync_at ? ` · ${new Date(s.last_sync_at).toLocaleString("fr-FR")}` : ""}
                      </span>
                    </span>
                    <span className="text-xs text-primary">Configurer</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Disponibles</p>
        <div className="space-y-4">
          {CONNECTOR_CATEGORIES.map((cat) => {
            const list = available.filter((c) => c.category === cat.key);
            if (!list.length) return null;
            return (
              <div key={cat.key}>
                <p className="mb-1.5 text-xs text-muted-foreground">
                  {cat.icon} {cat.label}
                </p>
                <ul className="space-y-2">
                  {list.map((c) => (
                    <li key={c.id} className="surface-panel flex items-center gap-3 p-3">
                      <span className="text-xl">{c.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium">{c.name}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{c.description}</span>
                      </span>
                      {c.availability === "soon" ? (
                        <span className="text-[11px] text-muted-foreground">Bientôt</span>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 rounded-xl"
                          disabled={save.isPending}
                          onClick={() =>
                            save.mutate(
                              { projectSlug, connectorId: c.id },
                              { onSuccess: () => toast.success(`${c.name} ajouté au projet`) },
                            )
                          }
                        >
                          <Plus className="size-4" /> Ajouter
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {open ? (
        <ConnectorDialog
          def={open}
          projectSlug={projectSlug}
          link={links.find((l) => l.connector_id === open.id)}
          status={status.find((x) => x.connector_id === open.id)}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </div>
  );
}

function ConnectorDialog({
  def,
  projectSlug,
  link,
  status,
  onClose,
}: {
  def: ConnectorDef;
  projectSlug: string;
  link?: ProjectConnector;
  status?: ConnectorStatusDTO;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const save = useSaveProjectConnector();
  const syncFn = useServerFn(syncConnectorNow);
  const purgeFn = useServerFn(purgeConnectorDataFn);
  const [confirm, setConfirm] = useState<"remove" | "purge" | null>(null);
  const [typed, setTyped] = useState("");
  const ui = statusOf(def, status);
  const perms = link?.granted_permissions ?? [];

  const sync = useMutation({
    mutationFn: () => syncFn({ data: { connectorId: def.id, projectSlug } }),
    onSuccess: (r) => {
      toast.success(`${r.imported} éléments synchronisés`);
      qc.invalidateQueries();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const purge = useMutation({
    mutationFn: () => purgeFn({ data: { connectorId: def.id, projectSlug } }),
    onSuccess: () => {
      toast.success("Données synchronisées supprimées");
      qc.invalidateQueries();
      setConfirm(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSync = def.id === "gumroad" ? status?.status !== "not_connected" : def.id === "google_drive" && status?.status === "connected";

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <DialogHeader className="text-left">
          <DialogTitle>
            {def.icon} {def.name}
          </DialogTitle>
        </DialogHeader>
        <div className="-mx-1 min-h-0 flex-1 space-y-4 overflow-y-auto px-1 text-sm">
          <div className="surface-panel p-3 text-xs">
            <p>
              {ui.dot} {ui.label}
              {status?.account_label ? ` — Compte : ${status.account_label}` : ""}
            </p>
            <p className="mt-1 text-muted-foreground">
              {status?.items_count ?? 0} éléments
              {status?.last_sync_at ? ` · Dernière synchro : ${new Date(status.last_sync_at).toLocaleString("fr-FR")}` : ""}
            </p>
            {status?.last_error ? <p className="mt-1 text-destructive">{status.last_error}</p> : null}
            {status?.missing.length ? (
              <p className="mt-1 text-destructive">À configurer : {status.missing.join(", ")}</p>
            ) : null}
          </div>

          {def.modes ? (
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Mode</p>
              <ul className="space-y-2">
                {def.modes.map((m) => (
                  <li key={m.key} className="surface-panel p-3">
                    <p className="text-sm font-medium">
                      {m.label}{" "}
                      <span className="text-[11px] text-muted-foreground">
                        {m.availability === "available" ? "🟢 disponible" : "⚪ à configurer"}
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">{m.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {def.permissions.length ? (
            <div>
              <p className="mb-1.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Permissions</p>
              <ul className="space-y-1.5">
                {def.permissions.map((p) => (
                  <li key={p.key}>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={perms.includes(p.key)}
                        disabled={p.key === "write" || p.key === "publish"}
                        onCheckedChange={(v) =>
                          save.mutate({
                            projectSlug,
                            connectorId: def.id,
                            patch: {
                              granted_permissions: v ? [...perms, p.key] : perms.filter((k) => k !== p.key),
                            },
                          })
                        }
                      />
                      {p.label}
                      {p.key === "write" || p.key === "publish" ? (
                        <span className="text-[11px] text-muted-foreground">(non demandé)</span>
                      ) : null}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {def.id === "google_drive" && status?.status === "connected" ? (
            <DriveFolders projectSlug={projectSlug} link={link} />
          ) : null}

          <div className="grid gap-2">
            {def.manageHref ? (
              <Button asChild variant="outline" className="h-11 rounded-xl">
                <Link to={def.manageHref}>{def.id === "pinterest" ? "Importer un rapport" : "Gérer le compte"}</Link>
              </Button>
            ) : null}
            {canSync ? (
              <Button className="h-11 rounded-xl" disabled={sync.isPending} onClick={() => sync.mutate()}>
                <RefreshCw className={sync.isPending ? "size-4 animate-spin" : "size-4"} /> Synchroniser maintenant
              </Button>
            ) : null}
          </div>

          {confirm ? (
            <div className="surface-panel space-y-2 p-3">
              {confirm === "remove" ? (
                <>
                  <p className="text-sm">Retirer {def.name} de ce projet ? Les données déjà synchronisées sont conservées.</p>
                  <Button
                    variant="destructive"
                    className="h-11 w-full rounded-xl"
                    onClick={() =>
                      save.mutate({ projectSlug, connectorId: def.id, remove: true }, { onSuccess: onClose })
                    }
                  >
                    Retirer du projet
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm">Supprimer définitivement les données synchronisées ? Tapez SUPPRIMER.</p>
                  <Input value={typed} onChange={(e) => setTyped(e.target.value)} className="h-11" />
                  <Button
                    variant="destructive"
                    className="h-11 w-full rounded-xl"
                    disabled={typed !== "SUPPRIMER" || purge.isPending}
                    onClick={() => purge.mutate()}
                  >
                    Supprimer les données
                  </Button>
                </>
              )}
            </div>
          ) : null}
        </div>
        <DialogFooter className="shrink-0 flex-row gap-2">
          <Button variant="ghost" className="h-11 flex-1 rounded-xl" onClick={() => setConfirm("remove")}>
            Retirer
          </Button>
          <Button variant="ghost" className="h-11 flex-1 rounded-xl text-destructive" onClick={() => setConfirm("purge")}>
            Supprimer données
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DriveFolders({ projectSlug, link }: { projectSlug: string; link?: ProjectConnector }) {
  const listFn = useServerFn(driveListFn);
  const addFn = useServerFn(driveAddReferenceFn);
  const save = useSaveProjectConnector();
  const qc = useQueryClient();
  const { data: refs = [] } = useConnectedObjects(projectSlug, "google_drive");
  const [stack, setStack] = useState<{ id: string | null; name: string }[]>([{ id: null, name: "Mon Drive" }]);
  const [items, setItems] = useState<Awaited<ReturnType<typeof listFn>> | null>(null);
  const [loading, setLoading] = useState(false);
  const allowed = link?.allowed_folders ?? [];
  const current = stack[stack.length - 1]!;

  async function load(id: string | null) {
    setLoading(true);
    try {
      setItems(await listFn({ data: { folderId: id } }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur Drive");
    } finally {
      setLoading(false);
    }
  }

  const isAllowed = current.id ? allowed.some((f) => f.id === current.id) : false;

  return (
    <div>
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Dossiers autorisés</p>
      {allowed.length ? (
        <ul className="mb-2 space-y-1 text-xs">
          {allowed.map((f) => (
            <li key={f.id} className="flex items-center gap-2">
              <Folder className="size-3.5 text-primary" /> {f.name}
              <button
                type="button"
                className="ml-auto text-muted-foreground underline"
                onClick={() =>
                  save.mutate({ projectSlug, connectorId: "google_drive", patch: { allowed_folders: allowed.filter((x) => x.id !== f.id) } })
                }
              >
                retirer
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-2 text-xs text-muted-foreground">Aucun dossier autorisé : rien n'est accessible.</p>
      )}
      {items === null ? (
        <Button variant="outline" className="h-10 w-full rounded-xl" onClick={() => load(null)} disabled={loading}>
          Parcourir mon Drive
        </Button>
      ) : (
        <div className="surface-panel p-2">
          <div className="mb-2 flex items-center gap-2 text-xs">
            {stack.length > 1 ? (
              <button
                type="button"
                aria-label="Dossier parent"
                onClick={() => {
                  const next = stack.slice(0, -1);
                  setStack(next);
                  load(next[next.length - 1]!.id);
                }}
              >
                <ChevronLeft className="size-4" />
              </button>
            ) : null}
            <span className="min-w-0 flex-1 truncate font-medium">{current.name}</span>
            {current.id && !isAllowed ? (
              <button
                type="button"
                className="text-primary"
                onClick={() =>
                  save.mutate({
                    projectSlug,
                    connectorId: "google_drive",
                    patch: { allowed_folders: [...allowed, { id: current.id!, name: current.name }] },
                  })
                }
              >
                Autoriser ce dossier
              </button>
            ) : null}
          </div>
          {loading ? <p className="p-2 text-xs text-muted-foreground">Chargement…</p> : null}
          <ul className="max-h-60 space-y-1 overflow-y-auto">
            {items.map((f) => {
              const added = refs.some((r) => r.external_id === f.id);
              return (
                <li key={f.id} className="flex items-center gap-2 rounded-lg p-1.5 text-xs">
                  {f.isFolder ? (
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      onClick={() => {
                        setStack([...stack, { id: f.id, name: f.name }]);
                        load(f.id);
                      }}
                    >
                      <Folder className="size-3.5 text-primary" />
                      <span className="truncate">{f.name}</span>
                    </button>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate">{f.name}</span>
                      {isAllowed ? (
                        <button
                          type="button"
                          disabled={added}
                          className="text-primary disabled:text-muted-foreground"
                          onClick={async () => {
                            try {
                              await addFn({ data: { projectSlug, fileId: f.id } });
                              toast.success("Référence ajoutée aux fichiers du projet");
                              qc.invalidateQueries({ queryKey: ["connected-objects"] });
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Erreur");
                            }
                          }}
                        >
                          {added ? "Ajouté" : "+ Référence"}
                        </button>
                      ) : null}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
