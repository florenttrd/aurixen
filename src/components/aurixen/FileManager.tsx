import { Download, File as FileIcon, FolderPlus, Folder, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  useCreateFolder,
  useDeleteFile,
  useDeleteFolder,
  useFiles,
  useFolders,
  useMoveFile,
  useUploadFile,
  type StoredFile,
} from "@/hooks/useAurixen";

const ROOT = "__root__";

export function FileManager({ projectSlug }: { projectSlug: string }) {
  const { data: folders = [] } = useFolders(projectSlug);
  const { data: files = [] } = useFiles(projectSlug);
  const createFolder = useCreateFolder(projectSlug);
  const deleteFolder = useDeleteFolder(projectSlug);
  const upload = useUploadFile(projectSlug);
  const move = useMoveFile(projectSlug);
  const removeFile = useDeleteFile(projectSlug);

  const [current, setCurrent] = useState<string>(ROOT);
  const [folderName, setFolderName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const folderId = current === ROOT ? null : current;
  const visible = files.filter((f) => (f.folder_id ?? ROOT) === current);

  async function openFile(file: StoredFile) {
    const { data, error } = await supabase.storage
      .from("aurixen-files")
      .createSignedUrl(file.storage_path, 60);
    if (error || !data) {
      toast.error("Impossible d'ouvrir le fichier");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <>
      <SectionTitle
        overline="Documents du projet"
        title="Fichiers"
        action={
          <Button size="sm" className="h-10 rounded-full" onClick={() => inputRef.current?.click()}>
            <Upload className="size-4" /> Ajouter
          </Button>
        }
      />
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload.mutate({ file, folderId });
          e.target.value = "";
        }}
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCurrent(ROOT)}
          data-active={current === ROOT}
          className="h-10 shrink-0 rounded-full border border-border px-4 text-xs font-medium text-muted-foreground data-[active=true]:border-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
        >
          Racine
        </button>
        {folders.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setCurrent(f.id)}
            data-active={current === f.id}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-border px-4 text-xs font-medium text-muted-foreground data-[active=true]:border-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
          >
            <Folder className="size-3.5" />
            {f.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setFolderName("")}
          aria-label="Créer un dossier"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-dashed border-border text-muted-foreground"
        >
          <FolderPlus className="size-4" />
        </button>
      </div>

      {folderId ? (
        <button
          type="button"
          onClick={() => {
            deleteFolder.mutate(folderId);
            setCurrent(ROOT);
          }}
          className="mb-4 text-xs text-destructive underline underline-offset-4"
        >
          Supprimer ce dossier
        </button>
      ) : null}

      {visible.length === 0 ? (
        <div className="surface-panel p-6 text-center text-sm text-muted-foreground">
          Aucun fichier dans cet emplacement.
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((file) => (
            <li key={file.id} className="surface-panel p-3">
              <div className="flex items-center gap-3">
                <FileIcon className="size-5 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{file.name}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {file.size_bytes ? `${(file.size_bytes / 1024).toFixed(0)} Ko · ` : ""}
                    {new Date(file.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label="Ouvrir le fichier"
                  onClick={() => openFile(file)}
                  className="grid size-10 place-items-center rounded-lg text-muted-foreground active:bg-muted"
                >
                  <Download className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Supprimer le fichier"
                  onClick={() => removeFile.mutate(file)}
                  className="grid size-10 place-items-center rounded-lg text-destructive active:bg-muted"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              {folders.length > 0 ? (
                <Select
                  value={file.folder_id ?? ROOT}
                  onValueChange={(v) =>
                    move.mutate({ id: file.id, folderId: v === ROOT ? null : v })
                  }
                >
                  <SelectTrigger className="mt-2 h-10 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROOT}>Racine</SelectItem>
                    {folders.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={folderName !== null} onOpenChange={(v) => !v && setFolderName(null)}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>Nouveau dossier</DialogTitle>
          </DialogHeader>
          <Input
            className="h-12"
            placeholder="Nom du dossier"
            value={folderName ?? ""}
            onChange={(e) => setFolderName(e.target.value)}
          />
          <DialogFooter>
            <Button
              className="h-12 w-full rounded-xl"
              onClick={() => {
                if (!folderName?.trim()) return;
                createFolder.mutate(folderName.trim(), { onSuccess: () => setFolderName(null) });
              }}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
