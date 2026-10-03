import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

export type CanvasBookmark = { name: string; scrollX: number; scrollY: number; zoom: number };

export type CanvasRow = {
  id: string;
  project_slug: string;
  name: string;
  elements: unknown[];
  app_state: Record<string, unknown>;
  file_ids: string[];
  bookmarks: CanvasBookmark[];
  updated_at: string;
  created_at: string;
};

// The canvases table is new; keep the client loosely typed until types regenerate.
const db = supabase as unknown as { from: (t: string) => any };

export function useCanvases(projectSlug: string) {
  return useQuery({
    queryKey: ["canvases", projectSlug],
    queryFn: async () => {
      const { data, error } = await db
        .from("canvases")
        .select("id, project_slug, name, updated_at, created_at, elements")
        .eq("project_slug", projectSlug)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CanvasRow[];
    },
  });
}

export function useCanvas(id: string) {
  return useQuery({
    queryKey: ["canvas", id],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await db.from("canvases").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as CanvasRow | null;
    },
  });
}

export function useCreateCanvas(projectSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Session expirée");
      const { data, error } = await db
        .from("canvases")
        .insert({ user_id: u.user.id, project_slug: projectSlug, name: name.trim() || "Sans titre" })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["canvases", projectSlug] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRenameCanvas(projectSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await db.from("canvases").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["canvases", projectSlug] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCanvas(projectSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (canvas: { id: string; file_ids?: string[] }) => {
      const { data: u } = await supabase.auth.getUser();
      const { data: row } = await db.from("canvases").select("file_ids").eq("id", canvas.id).maybeSingle();
      const ids: string[] = row?.file_ids ?? [];
      if (u.user && ids.length) {
        await supabase.storage
          .from("aurixen-files")
          .remove(ids.map((f) => `${u.user!.id}/canvas/${canvas.id}/${f.split("|")[0]}`));
      }
      const { error } = await db.from("canvases").delete().eq("id", canvas.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["canvases", projectSlug] });
      toast.success("Canvas supprimé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export async function saveCanvas(id: string, patch: Partial<Omit<CanvasRow, "id">>) {
  const { error } = await db.from("canvases").update(patch).eq("id", id);
  if (error) throw error;
}
