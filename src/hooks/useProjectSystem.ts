import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import {
  DEFAULT_MODULE_KEYS,
  defaultHomeLayout,
  findModuleDef,
  type HomeBlock,
  type ModuleField,
} from "@/lib/modules";

async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Session expirée");
  return data.user.id;
}

export type Project = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  subtitle: string | null;
  initials: string | null;
  accent: string;
  accent_secondary: string;
  surface: string;
  font_display: string;
  font_body: string;
  radius: number;
  effects: string;
  home_layout: HomeBlock[];
  home_density: string;
  sort_order: number;
  created_at: string;
};

export type ProjectModule = {
  id: string;
  project_slug: string;
  module_key: string;
  kind: string;
  label: string | null;
  icon: string | null;
  enabled: boolean;
  position: number;
  fields: ModuleField[];
};

function normalizeProject(row: Record<string, unknown>): Project {
  return {
    ...(row as unknown as Project),
    home_layout: (row["home_layout"] ?? []) as HomeBlock[],
  };
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data ?? []).map(normalizeProject);
    },
  });
}

export function useProject(slug: string) {
  return useQuery({
    queryKey: ["project", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data ? normalizeProject(data) : null;
    },
  });
}

export function useProjectModules(slug: string) {
  return useQuery({
    queryKey: ["project-modules", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_modules")
        .select("*")
        .eq("project_slug", slug)
        .order("position");
      if (error) throw error;
      return (data ?? []).map((m) => ({
        ...(m as unknown as ProjectModule),
        fields: (m.fields ?? []) as ModuleField[],
      }));
    },
  });
}

export function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export type NewProject = {
  name: string;
  subtitle?: string;
  modules: string[];
  accent: string;
  accent_secondary: string;
  surface: string;
  font_display: string;
  font_body: string;
  radius: number;
  effects: string;
  home_density: string;
};

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewProject) => {
      const user_id = await currentUserId();
      const base = slugify(input.name) || "projet";
      const { data: taken } = await supabase.from("projects").select("slug").like("slug", `${base}%`);
      let slug = base;
      let i = 2;
      while ((taken ?? []).some((t) => t.slug === slug)) slug = `${base}-${i++}`;

      const moduleKeys = input.modules.length ? input.modules : DEFAULT_MODULE_KEYS;
      const initials = input.name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      const { error } = await supabase.from("projects").insert({
        user_id,
        slug,
        name: input.name.trim(),
        subtitle: input.subtitle?.trim() || null,
        tagline: input.subtitle?.trim() || null,
        initials,
        accent: input.accent,
        accent_secondary: input.accent_secondary,
        surface: input.surface,
        font_display: input.font_display,
        font_body: input.font_body,
        radius: input.radius,
        effects: input.effects,
        home_density: input.home_density,
        home_layout: defaultHomeLayout(moduleKeys) as unknown as never,
      });
      if (error) throw error;

      const rows = moduleKeys.map((key, index) => {
        const def = findModuleDef(key);
        return {
          user_id,
          project_slug: slug,
          module_key: key,
          kind: def?.kind ?? "custom",
          label: def?.label ?? key,
          icon: def?.icon ?? "box",
          enabled: true,
          position: index,
          fields: (def?.fields ?? []) as unknown as never,
        };
      });
      const { error: modError } = await supabase.from("project_modules").insert(rows);
      if (modError) throw modError;
      return slug;
    },
    onSuccess: (slug) => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project-modules", slug] });
      toast.success("Projet créé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateProject(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Partial<Project>) => {
      const { error } = await supabase
        .from("projects")
        .update(patch as never)
        .eq("slug", slug);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", slug] });
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Enable / disable a module. Disabling only hides it — data is preserved. */
export function useToggleModule(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const user_id = await currentUserId();
      const def = findModuleDef(key);
      const { error } = await supabase.from("project_modules").upsert(
        {
          user_id,
          project_slug: slug,
          module_key: key,
          kind: def?.kind ?? "custom",
          label: def?.label ?? key,
          icon: def?.icon ?? "box",
          enabled,
          fields: (def?.fields ?? []) as unknown as never,
        },
        { onConflict: "user_id,project_slug,module_key" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-modules", slug] }),
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Create a custom module with user-defined fields. */
export function useCreateCustomModule(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ label, fields }: { label: string; fields: ModuleField[] }) => {
      const user_id = await currentUserId();
      const key = `custom-${slugify(label) || Date.now()}`;
      const { error } = await supabase.from("project_modules").insert({
        user_id,
        project_slug: slug,
        module_key: key,
        kind: "custom",
        label: label.trim(),
        icon: "box",
        enabled: true,
        position: 99,
        fields: fields as unknown as never,
      });
      if (error) throw error;
      return key;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-modules", slug] });
      toast.success("Module créé");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Explicit destructive action: wipe a module's data for this project. */
export function usePurgeModuleData(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      if (key === "notes") {
        const { error } = await supabase.from("notes").delete().eq("project_slug", slug);
        if (error) throw error;
      } else if (key === "calendrier") {
        const { error } = await supabase.from("events").delete().eq("project_slug", slug);
        if (error) throw error;
      } else if (key === "taches") {
        const { error } = await supabase.from("tasks").delete().eq("project_slug", slug);
        if (error) throw error;
      } else if (key === "journal") {
        const { error } = await supabase.from("journal_entries").delete().eq("project_slug", slug);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("module_records")
          .delete()
          .eq("project_slug", slug)
          .eq("module_key", key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Données du module supprimées");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, slug }: { id: string; slug: string }) => {
      await supabase.from("project_modules").delete().eq("project_slug", slug);
      await supabase.from("notes").delete().eq("project_slug", slug);
      await supabase.from("events").delete().eq("project_slug", slug);
      await supabase.from("tasks").delete().eq("project_slug", slug);
      await supabase.from("journal_entries").delete().eq("project_slug", slug);
      await supabase.from("module_records").delete().eq("project_slug", slug);
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries(),
    onError: (e: Error) => toast.error(e.message),
  });
}
