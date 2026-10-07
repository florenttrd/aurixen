import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ConnectorStatusDTO } from "./connectors";

const KNOWN = ["gumroad", "pinterest", "google_drive"];
const str = (v: unknown, name: string) => {
  if (typeof v !== "string" || !v || v.length > 200) throw new Error(`${name} invalide`);
  return v;
};

export const getConnectorsStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ConnectorStatusDTO[]> => {
    const mod = await import("./connectors.server");
    return mod.connectorsStatus(context.userId);
  });

export const syncConnectorNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { connectorId: string; projectSlug?: string }) => {
    if (!KNOWN.includes(i.connectorId)) throw new Error("Connecteur inconnu");
    return { connectorId: i.connectorId, projectSlug: i.projectSlug ? str(i.projectSlug, "Projet") : undefined };
  })
  .handler(async ({ data, context }) => {
    const mod = await import("./connectors.server");
    return mod.syncConnector(context.userId, data.connectorId, data.projectSlug);
  });

export const purgeConnectorDataFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { connectorId: string; projectSlug: string }) => {
    if (!KNOWN.includes(i.connectorId)) throw new Error("Connecteur inconnu");
    return { connectorId: i.connectorId, projectSlug: str(i.projectSlug, "Projet") };
  })
  .handler(async ({ data, context }) => {
    const mod = await import("./connectors.server");
    return mod.purgeConnectorData(context.userId, data.connectorId, data.projectSlug);
  });

export const driveListFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { folderId?: string | null }) => ({
    folderId: i.folderId ? str(i.folderId, "Dossier") : null,
  }))
  .handler(async ({ data }) => {
    const mod = await import("./connectors.server");
    return mod.driveList(data.folderId);
  });

export const driveAddReferenceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { projectSlug: string; fileId: string }) => ({
    projectSlug: str(i.projectSlug, "Projet"),
    fileId: str(i.fileId, "Fichier"),
  }))
  .handler(async ({ data, context }) => {
    const mod = await import("./connectors.server");
    return mod.driveAddReference(context.userId, data.projectSlug, data.fileId);
  });
