import "@excalidraw/excalidraw/index.css";

import {
  CaptureUpdateAction,
  Excalidraw,
  MainMenu,
  convertToExcalidrawElements,
} from "@excalidraw/excalidraw";
import { useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Bookmark,
  Check,
  FileText,
  Loader2,
  Maximize2,
  ScanSearch,
  StickyNote,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useFiles } from "@/hooks/useAurixen";
import { saveCanvas, useCanvas, type CanvasBookmark } from "@/hooks/useCanvases";

/* Excalidraw's own types are deep; keep this boundary loosely typed. */
type Api = any;
type El = { id: string; version: number; isDeleted?: boolean; type: string; fileId?: string | null };
type SaveState = "idle" | "saving" | "saved" | "error";

const NOTE_COLORS = ["#ffec99", "#b2f2bb", "#a5d8ff", "#ffc9c9", "#eebefa"];

function dataUrlToBlob(dataURL: string) {
  const [head, body] = dataURL.split(",");
  const mime = /data:(.*?);/.exec(head ?? "")?.[1] ?? "application/octet-stream";
  const bin = atob(body ?? "");
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

export default function CanvasEditor({ canvasId }: { canvasId: string }) {
  const router = useRouter();
  const { data: canvas, isLoading } = useCanvas(canvasId);
  const [api, setApi] = useState<Api>(null);
  const [save, setSave] = useState<SaveState>("idle");
  const [viewsOpen, setViewsOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<CanvasBookmark[]>([]);
  const [viewName, setViewName] = useState("");

  const userId = useRef<string | null>(null);
  const uploaded = useRef<Set<string>>(new Set());
  const fileIndex = useRef<Map<string, string>>(new Map()); // id -> mime
  const lastKey = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<null | (() => Promise<void>)>(null);
  const noteColor = useRef(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => (userId.current = data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!canvas) return;
    setBookmarks(canvas.bookmarks ?? []);
    for (const f of canvas.file_ids ?? []) {
      const [id, mime] = f.split("|");
      if (id) {
        uploaded.current.add(id);
        fileIndex.current.set(id, mime ?? "image/png");
      }
    }
  }, [canvas]);

  const initialData = useMemo(() => {
    if (!canvas) return null;
    const st = canvas.app_state ?? {};
    return {
      elements: canvas.elements as never[],
      appState: {
        theme: (st["theme"] as string) ?? "light",
        viewBackgroundColor: (st["viewBackgroundColor"] as string) ?? undefined,
        scrollX: (st["scrollX"] as number) ?? 0,
        scrollY: (st["scrollY"] as number) ?? 0,
        zoom: { value: (st["zoom"] as number) ?? 1 },
        gridModeEnabled: Boolean(st["gridModeEnabled"]),
      },
      scrollToContent: st["scrollX"] === undefined,
    };
  }, [canvas]);

  // Load image binaries stored in the private bucket once the editor is ready.
  useEffect(() => {
    if (!api || !canvas) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;
      const loaded: unknown[] = [];
      await Promise.all(
        [...fileIndex.current.entries()].map(async ([id, mime]) => {
          const { data: blob } = await supabase.storage
            .from("aurixen-files")
            .download(`${uid}/canvas/${canvasId}/${id}`);
          if (!blob) return;
          loaded.push({ id, mimeType: mime, dataURL: await blobToDataUrl(blob), created: Date.now() });
        }),
      );
      if (!cancelled && loaded.length) api.addFiles(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [api, canvas, canvasId]);

  const persist = useCallback(
    async (elements: readonly El[], appState: Record<string, any>, files: Record<string, any>) => {
      setSave("saving");
      try {
        const uid = userId.current;
        const live = elements.filter((e) => !e.isDeleted);
        // Upload new image binaries referenced by the scene.
        for (const el of live) {
          const fid = el.fileId;
          if (el.type !== "image" || !fid || uploaded.current.has(fid)) continue;
          const file = files[fid];
          if (!file?.dataURL || !uid) continue;
          const { error } = await supabase.storage
            .from("aurixen-files")
            .upload(`${uid}/canvas/${canvasId}/${fid}`, dataUrlToBlob(file.dataURL), {
              upsert: true,
              contentType: file.mimeType,
            });
          if (error) throw error;
          uploaded.current.add(fid);
          fileIndex.current.set(fid, file.mimeType);
        }
        await saveCanvas(canvasId, {
          elements: live as unknown[],
          app_state: {
            theme: appState["theme"],
            viewBackgroundColor: appState["viewBackgroundColor"],
            scrollX: appState["scrollX"],
            scrollY: appState["scrollY"],
            zoom: appState["zoom"]?.value ?? 1,
            gridModeEnabled: appState["gridModeEnabled"],
          },
          file_ids: [...fileIndex.current.entries()].map(([id, mime]) => `${id}|${mime}`),
        });
        setSave("saved");
      } catch (e) {
        setSave("error");
        toast.error(`Sauvegarde impossible : ${(e as Error).message}`);
      }
    },
    [canvasId],
  );

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const job = pending.current;
    pending.current = null;
    if (job) void job();
  }, []);

  const onChange = useCallback(
    (elements: readonly El[], appState: Record<string, any>, files: Record<string, any>) => {
      const versions = elements.reduce((s, e) => s + e.version, 0);
      const key = `${elements.length}:${versions}:${Math.round(appState["scrollX"])}:${Math.round(
        appState["scrollY"],
      )}:${appState["zoom"]?.value}:${appState["theme"]}:${appState["viewBackgroundColor"]}`;
      if (key === lastKey.current) return;
      const first = lastKey.current === "";
      lastKey.current = key;
      if (first) return; // initial mount
      pending.current = () => persist(elements, appState, files);
      setSave("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 900);
    },
    [persist, flush],
  );

  // Never lose work: flush on tab hide / page leave / unmount.
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  function viewportCenter() {
    const st = api.getAppState();
    const z = st.zoom.value;
    return { x: -st.scrollX + st.width / 2 / z, y: -st.scrollY + st.height / 2 / z };
  }

  function insert(skeletons: any[], link?: string) {
    if (!api) return;
    const els = convertToExcalidrawElements(skeletons, { regenerateIds: true }) as any[];
    if (link && els[0]) els[0] = { ...els[0], link };
    api.updateScene({
      elements: [...api.getSceneElements(), ...els],
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    });
    api.selectElements?.(els.slice(0, 1));
  }

  function addNote() {
    const c = viewportCenter();
    const color = NOTE_COLORS[noteColor.current++ % NOTE_COLORS.length];
    insert([
      {
        type: "rectangle",
        x: c.x - 110,
        y: c.y - 80,
        width: 220,
        height: 160,
        backgroundColor: color,
        fillStyle: "solid",
        strokeColor: "#1e1e1e",
        strokeWidth: 1,
        roughness: 0,
        roundness: { type: 3 },
        label: { text: "Note", fontSize: 20, strokeColor: "#1e1e1e" },
      },
    ]);
  }

  async function addFileRef(file: { name: string; storage_path: string }) {
    const { data, error } = await supabase.storage
      .from("aurixen-files")
      .createSignedUrl(file.storage_path, 60 * 60 * 24 * 365);
    if (error || !data) {
      toast.error("Lien du fichier indisponible");
      return;
    }
    const c = viewportCenter();
    insert(
      [
        {
          type: "rectangle",
          x: c.x - 130,
          y: c.y - 35,
          width: 260,
          height: 70,
          backgroundColor: "#e9ecef",
          fillStyle: "solid",
          strokeColor: "#495057",
          roughness: 0,
          roundness: { type: 3 },
          label: { text: `📄 ${file.name}`, fontSize: 16, strokeColor: "#1e1e1e" },
        },
      ],
      data.signedUrl,
    );
    setFilesOpen(false);
  }

  function fit(selectionOnly: boolean) {
    if (!api) return;
    const all = api.getSceneElements();
    const sel = api.getAppState().selectedElementIds ?? {};
    const target = selectionOnly ? all.filter((e: El) => sel[e.id]) : all;
    if (selectionOnly && target.length === 0) {
      toast("Sélectionnez d'abord un ou plusieurs objets");
      return;
    }
    api.scrollToContent(target.length ? target : undefined, { fitToContent: true, animate: true });
  }

  async function persistBookmarks(next: CanvasBookmark[]) {
    setBookmarks(next);
    try {
      await saveCanvas(canvasId, { bookmarks: next });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function addBookmark() {
    if (!api) return;
    const st = api.getAppState();
    void persistBookmarks([
      ...bookmarks,
      { name: viewName.trim() || `Vue ${bookmarks.length + 1}`, scrollX: st.scrollX, scrollY: st.scrollY, zoom: st.zoom.value },
    ]);
    setViewName("");
  }

  function goTo(b: CanvasBookmark) {
    api?.updateScene({ appState: { scrollX: b.scrollX, scrollY: b.scrollY, zoom: { value: b.zoom } } });
    setViewsOpen(false);
  }

  function back() {
    flush();
    if (window.history.length > 1) router.history.back();
    else router.navigate({ to: "/hub" });
  }

  if (isLoading || !initialData) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background text-sm text-muted-foreground">
        {isLoading ? "Ouverture du canvas…" : "Canvas introuvable"}
        {!isLoading ? (
          <Button variant="outline" onClick={back}>
            Retour
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <header className="safe-top flex h-14 shrink-0 items-center gap-1 border-b border-border/70 px-2">
        <Button size="icon" variant="ghost" aria-label="Retour" onClick={back}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{canvas?.name}</p>
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            {save === "saving" ? (
              <>
                <Loader2 className="size-3 animate-spin" /> Sauvegarde en cours…
              </>
            ) : save === "error" ? (
              <span className="text-destructive">Erreur de sauvegarde</span>
            ) : (
              <>
                <Check className="size-3" /> Sauvegardé
              </>
            )}
          </p>
        </div>
        <Button size="icon" variant="ghost" aria-label="Ajouter une note" onClick={addNote}>
          <StickyNote className="size-5" />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Ajouter un fichier Aurixen" onClick={() => setFilesOpen(true)}>
          <FileText className="size-5" />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Zoomer sur la sélection" onClick={() => fit(true)}>
          <ScanSearch className="size-5" />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Tout afficher" onClick={() => fit(false)}>
          <Maximize2 className="size-5" />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Vues enregistrées" onClick={() => setViewsOpen(true)}>
          <Bookmark className="size-5" />
        </Button>
      </header>

      <div className="relative min-h-0 flex-1">
        <Excalidraw
          excalidrawAPI={(a: Api) => setApi(a)}
          initialData={initialData as never}
          onChange={onChange as never}
          langCode="fr-FR"
          UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false } }}
        >
          <MainMenu>
            <MainMenu.DefaultItems.Export />
            <MainMenu.DefaultItems.SaveAsImage />
            <MainMenu.DefaultItems.SearchMenu />
            <MainMenu.DefaultItems.Help />
            <MainMenu.DefaultItems.ClearCanvas />
            <MainMenu.Separator />
            <MainMenu.DefaultItems.ToggleTheme />
            <MainMenu.DefaultItems.ChangeCanvasBackground />
          </MainMenu>
        </Excalidraw>
      </div>

      <Sheet open={viewsOpen} onOpenChange={setViewsOpen}>
        <SheetContent side="bottom" className="max-h-[70dvh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle>Vues enregistrées</SheetTitle>
          </SheetHeader>
          <div className="mt-3 flex gap-2">
            <Input className="h-11" placeholder="Nom de la vue actuelle" value={viewName} onChange={(e) => setViewName(e.target.value)} />
            <Button className="h-11 rounded-xl" onClick={addBookmark}>
              Enregistrer
            </Button>
          </div>
          <ul className="mt-3 space-y-2">
            {bookmarks.length === 0 ? (
              <li className="text-sm text-muted-foreground">Enregistrez un endroit du canvas pour y revenir en un tap.</li>
            ) : null}
            {bookmarks.map((b, i) => (
              <li key={`${b.name}-${i}`} className="flex items-center gap-2">
                <Button variant="outline" className="h-11 flex-1 justify-start rounded-xl" onClick={() => goTo(b)}>
                  <Bookmark className="size-4" /> {b.name}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Supprimer la vue"
                  onClick={() => persistBookmarks(bookmarks.filter((_, j) => j !== i))}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      <Sheet open={filesOpen} onOpenChange={setFilesOpen}>
        <SheetContent side="bottom" className="max-h-[70dvh] overflow-y-auto">
          <SheetHeader className="text-left">
            <SheetTitle>Ajouter un fichier du projet</SheetTitle>
          </SheetHeader>
          {canvas ? <FilePicker projectSlug={canvas.project_slug} onPick={addFileRef} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FilePicker({
  projectSlug,
  onPick,
}: {
  projectSlug: string;
  onPick: (f: { name: string; storage_path: string }) => void;
}) {
  const { data: files = [] } = useFiles(projectSlug);
  if (files.length === 0)
    return <p className="mt-3 text-sm text-muted-foreground">Aucun fichier dans ce projet.</p>;
  return (
    <ul className="mt-3 space-y-2">
      {files.map((f) => (
        <li key={f.id}>
          <Button variant="outline" className="h-11 w-full justify-start rounded-xl" onClick={() => onPick(f)}>
            <FileText className="size-4" /> <span className="truncate">{f.name}</span>
          </Button>
        </li>
      ))}
    </ul>
  );
}
