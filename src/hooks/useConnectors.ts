import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import { findConnector } from "@/lib/connectors";
import { getConnectorsStatus } from "@/lib/connectors.functions";

export type ProjectConnector = {
  id: string;
  project_slug: string;
  connector_id: string;
  account_id: string | null;
  enabled: boolean;
  mode: string | null;
  granted_permissions: string[];
  allowed_folders: { id: string; name: string }[];
};

export function useConnectorsStatus() {
  const fn = useServerFn(getConnectorsStatus);
  return useQuery({ queryKey: ["connectors-status"], queryFn: () => fn(), staleTime: 30_000 });
}

export function useProjectConnectors(projectSlug?: string) {
  return useQuery({
    queryKey: ["project-connectors", projectSlug ?? "*"],
    queryFn: async () => {
      let q = supabase.from("project_connectors").select("*").order("created_at");
      if (projectSlug) q = q.eq("project_slug", projectSlug);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ProjectConnector[];
    },
  });
}

export function useConnectedObjects(projectSlug: string, source?: string) {
  return useQuery({
    queryKey: ["connected-objects", projectSlug, source ?? "*"],
    queryFn: async () => {
      let q = supabase.from("connected_objects").select("*").eq("project_slug", projectSlug).order("title");
      if (source) q = q.eq("source", source);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("Session expirée");
  return data.user.id;
}

export async function attachConnectors(projectSlug: string, ids: string[]) {
  if (!ids.length) return;
  const user_id = await uid();
  const rows = ids.map((connector_id) => ({
    user_id,
    project_slug: projectSlug,
    connector_id,
    mode: connector_id === "pinterest" ? "report" : null,
    granted_permissions: (findConnector(connector_id)?.permissions ?? []).filter((p) => p.default).map((p) => p.key),
  }));
  const { error } = await supabase.from("project_connectors").upsert(rows, { onConflict: "user_id,project_slug,connector_id" });
  if (error) throw error;
}

export function useSaveProjectConnector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { projectSlug: string; connectorId: string; patch?: Partial<ProjectConnector>; remove?: boolean }) => {
      if (input.remove) {
        const { error } = await supabase
          .from("project_connectors")
          .delete()
          .eq("project_slug", input.projectSlug)
          .eq("connector_id", input.connectorId);
        if (error) throw error;
        return;
      }
      await attachConnectors(input.projectSlug, [input.connectorId]);
      if (input.patch) {
        const { error } = await supabase
          .from("project_connectors")
          .update(input.patch as never)
          .eq("project_slug", input.projectSlug)
          .eq("connector_id", input.connectorId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project-connectors"] }),
  });
}
