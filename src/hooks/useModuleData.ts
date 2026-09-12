import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Session expirée");
  return data.user.id;
}

/* --------------------------------- tasks -------------------------------- */

export type Task = {
  id: string;
  project_slug: string;
  title: string;
  notes: string | null;
  done: boolean;
  due_date: string | null;
  priority: string;
  created_at: string;
};

export function useTasks(projectSlug: string) {
  return useQuery({
    queryKey: ["tasks", projectSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_slug", projectSlug)
        .order("done")
        .order("due_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Task[];
    },
  });
}

export function useSaveTask(projectSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<Task> & { id?: string }) => {
      const payload = {
        title: task.title ?? "Sans titre",
        notes: task.notes ?? null,
        done: task.done ?? false,
        due_date: task.due_date || null,
        priority: task.priority ?? "normale",
      };
      if (task.id) {
        const { error } = await supabase.from("tasks").update(payload).eq("id", task.id);
        if (error) throw error;
        return;
      }
      const user_id = await currentUserId();
      const { error } = await supabase
        .from("tasks")
        .insert({ ...payload, user_id, project_slug: projectSlug });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", projectSlug] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteTask(projectSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks", projectSlug] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

/* -------------------------------- journal ------------------------------- */

export type JournalEntry = {
  id: string;
  project_slug: string;
  entry_date: string;
  title: string;
  content: string;
  mood: string | null;
  created_at: string;
  updated_at: string;
};

export function useJournal(projectSlug: string) {
  return useQuery({
    queryKey: ["journal", projectSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries")
        .select("*")
        .eq("project_slug", projectSlug)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as JournalEntry[];
    },
  });
}

export function useSaveJournalEntry(projectSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Partial<JournalEntry> & { id?: string }) => {
      const payload = {
        entry_date: entry.entry_date || new Date().toISOString().slice(0, 10),
        title: entry.title ?? "",
        content: entry.content ?? "",
        mood: entry.mood ?? null,
      };
      if (entry.id) {
        const { error } = await supabase
          .from("journal_entries")
          .update(payload)
          .eq("id", entry.id);
        if (error) throw error;
        return;
      }
      const user_id = await currentUserId();
      const { error } = await supabase
        .from("journal_entries")
        .insert({ ...payload, user_id, project_slug: projectSlug });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal", projectSlug] });
      toast.success("Entrée enregistrée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteJournalEntry(projectSlug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal", projectSlug] });
      toast.success("Entrée supprimée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ---------------------------- module records ---------------------------- */

export type ModuleRecord = {
  id: string;
  project_slug: string;
  module_key: string;
  title: string;
  status: string | null;
  data: Record<string, string>;
  created_at: string;
};

export function useModuleRecords(projectSlug: string, moduleKey: string) {
  return useQuery({
    queryKey: ["module-records", projectSlug, moduleKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("module_records")
        .select("*")
        .eq("project_slug", projectSlug)
        .eq("module_key", moduleKey)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...(r as unknown as ModuleRecord),
        data: (r["data"] ?? {}) as Record<string, string>,
      }));
    },
  });
}

export function useSaveModuleRecord(projectSlug: string, moduleKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (record: Partial<ModuleRecord> & { id?: string }) => {
      const payload = {
        title: record.title ?? "Sans titre",
        status: record.status ?? null,
        data: (record.data ?? {}) as unknown as never,
      };
      if (record.id) {
        const { error } = await supabase
          .from("module_records")
          .update(payload)
          .eq("id", record.id);
        if (error) throw error;
        return;
      }
      const user_id = await currentUserId();
      const { error } = await supabase
        .from("module_records")
        .insert({ ...payload, user_id, project_slug: projectSlug, module_key: moduleKey });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["module-records", projectSlug, moduleKey] });
      toast.success("Fiche enregistrée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteModuleRecord(projectSlug: string, moduleKey: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("module_records").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["module-records", projectSlug, moduleKey] });
      toast.success("Fiche supprimée");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
