// Server-only : statut, synchronisation et Google Drive. Aucun jeton ne quitte ce module.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { ConnectorStatus, ConnectorStatusDTO } from "./connectors";
import { gumroadConfig, readIntegration, syncGumroad } from "./integrations.server";

const DRIVE_GATEWAY = "https://connector-gateway.lovable.dev/google_drive/drive/v3";

function driveKeys() {
  const lovable = process.env["LOVABLE_API_KEY"] ?? "";
  const conn = process.env["GOOGLE_DRIVE_API_KEY"] ?? "";
  const missing = [...(lovable ? [] : ["LOVABLE_API_KEY"]), ...(conn ? [] : ["Connexion Google Drive"])];
  return { lovable, conn, missing };
}

async function driveCall<T>(path: string, query: Record<string, string> = {}): Promise<T> {
  const { lovable, conn, missing } = driveKeys();
  if (missing.length) throw new Error("Google Drive n'est pas connecté.");
  const url = new URL(`${DRIVE_GATEWAY}${path}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": conn },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Drive [${res.status}]: ${body.slice(0, 300)}`);
    if (res.status === 401 || res.status === 403) throw new Error("Google Drive : reconnexion requise.");
    throw new Error(`Google Drive a répondu ${res.status}.`);
  }
  return (await res.json()) as T;
}

/** Garantit une ligne connector_accounts (métadonnées seulement). */
async function ensureAccount(userId: string, connectorId: string, patch: Record<string, unknown>) {
  const { data } = await supabaseAdmin
    .from("connector_accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("connector_id", connectorId)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (data) {
    await supabaseAdmin.from("connector_accounts").update(patch).eq("id", data.id);
    return data.id as string;
  }
  const { data: created, error } = await supabaseAdmin
    .from("connector_accounts")
    .insert({ user_id: userId, connector_id: connectorId, ...patch })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return created.id as string;
}

async function countRows(table: "sales" | "pins", userId: string, filter?: (q: any) => any) {
  let q: any = supabaseAdmin.from(table).select("id", { count: "exact", head: true }).eq("user_id", userId);
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

export async function connectorsStatus(userId: string): Promise<ConnectorStatusDTO[]> {
  const out: ConnectorStatusDTO[] = [];

  // Gumroad — reprend l'intégration existante telle quelle.
  const gum = await readIntegration(userId, "gumroad");
  const gumCfg = gumroadConfig();
  const gumStatus: ConnectorStatus = gumCfg.missing.length
    ? "not_connected"
    : gum?.status === "error"
      ? "error"
      : gum?.status === "syncing"
        ? "syncing"
        : gum?.status === "connected"
          ? gum.last_sync_at
            ? "synced"
            : "connected"
          : "not_connected";
  const gumCount = await countRows("sales", userId, (q) => q.eq("source", "gumroad"));
  const gumAccount =
    gumStatus === "not_connected"
      ? null
      : await ensureAccount(userId, "gumroad", {
          label: gum?.account_label ?? "Compte Gumroad",
          status: gumStatus,
          last_sync_at: gum?.last_sync_at ?? null,
          items_count: gumCount,
          last_error: gum?.last_error ?? null,
        });
  out.push({
    connector_id: "gumroad",
    status: gumStatus,
    account_id: gumAccount,
    account_label: gum?.account_label ?? null,
    last_sync_at: gum?.last_sync_at ?? null,
    items_count: gumCount,
    last_error: gum?.last_error ?? null,
    missing: gumCfg.missing,
  });

  // Pinterest — mode import de rapport (toujours disponible).
  const pinCount = await countRows("pins", userId);
  const { data: lastPin } = await supabaseAdmin
    .from("pins")
    .select("updated_at")
    .eq("user_id", userId)
    .like("external_id", "rapport:%")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  out.push({
    connector_id: "pinterest",
    status: lastPin ? "synced" : "connected",
    account_id: null,
    account_label: "Import de rapport",
    last_sync_at: lastPin?.updated_at ?? null,
    items_count: pinCount,
    last_error: null,
    missing: [],
  });

  // Google Drive — « connecté » seulement après un vrai appel réussi.
  const d = driveKeys();
  if (d.missing.length) {
    out.push({
      connector_id: "google_drive",
      status: "not_connected",
      account_id: null,
      account_label: null,
      last_sync_at: null,
      items_count: 0,
      last_error: null,
      missing: d.missing,
    });
  } else {
    try {
      const about = await driveCall<{ user?: { emailAddress?: string; displayName?: string } }>("/about", {
        fields: "user(emailAddress,displayName)",
      });
      const label = about.user?.emailAddress ?? about.user?.displayName ?? "Compte Google";
      const { count } = await supabaseAdmin
        .from("connected_objects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("source", "google_drive");
      const id = await ensureAccount(userId, "google_drive", {
        label,
        status: "connected",
        items_count: count ?? 0,
        last_error: null,
      });
      out.push({
        connector_id: "google_drive",
        status: "connected",
        account_id: id,
        account_label: label,
        last_sync_at: null,
        items_count: count ?? 0,
        last_error: null,
        missing: [],
      });
    } catch (e) {
      out.push({
        connector_id: "google_drive",
        status: "reauth_required",
        account_id: null,
        account_label: null,
        last_sync_at: null,
        items_count: 0,
        last_error: e instanceof Error ? e.message : "Erreur",
        missing: [],
      });
    }
  }
  return out;
}

export async function syncConnector(userId: string, connectorId: string, projectSlug?: string) {
  if (connectorId === "gumroad") {
    const r = await syncGumroad(userId);
    const accountId = await ensureAccount(userId, "gumroad", { status: "synced", last_sync_at: new Date().toISOString() });
    await supabaseAdmin
      .from("sales")
      .update({ account_id: accountId, last_synced_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("source", "gumroad");
    return { imported: r.imported };
  }
  if (connectorId === "google_drive") {
    // Met à jour les métadonnées des références déjà ajoutées (aucun import automatique).
    let q = supabaseAdmin.from("connected_objects").select("id, external_id").eq("user_id", userId).eq("source", "google_drive");
    if (projectSlug) q = q.eq("project_slug", projectSlug);
    const { data } = await q;
    let n = 0;
    for (const row of data ?? []) {
      const f = await driveCall<DriveFile>(`/files/${row.external_id}`, { fields: FILE_FIELDS }).catch(() => null);
      if (!f) continue;
      await supabaseAdmin.from("connected_objects").update(driveToObject(f)).eq("id", row.id);
      await supabaseAdmin.from("connected_object_raw").upsert({ object_id: row.id, user_id: userId, payload: f as never, fetched_at: new Date().toISOString() });
      n++;
    }
    return { imported: n };
  }
  throw new Error("Ce connecteur se synchronise par import, pas automatiquement.");
}

/* ------------------------------- Drive ---------------------------------- */

type DriveFile = { id: string; name: string; mimeType: string; webViewLink?: string; iconLink?: string; thumbnailLink?: string; modifiedTime?: string };
const FILE_FIELDS = "id,name,mimeType,webViewLink,iconLink,thumbnailLink,modifiedTime";

function driveToObject(f: DriveFile) {
  return {
    title: f.name,
    url: f.webViewLink ?? null,
    image_url: f.thumbnailLink ?? null,
    mime_type: f.mimeType,
    occurred_at: f.modifiedTime ?? null,
    last_synced_at: new Date().toISOString(),
  };
}

export async function driveList(folderId: string | null) {
  const parent = folderId ?? "root";
  const r = await driveCall<{ files: DriveFile[] }>("/files", {
    q: `'${parent.replace(/'/g, "")}' in parents and trashed = false`,
    fields: `files(${FILE_FIELDS})`,
    orderBy: "folder,name",
    pageSize: "100",
  });
  return r.files.map((f) => ({
    id: f.id,
    name: f.name,
    mimeType: f.mimeType,
    isFolder: f.mimeType === "application/vnd.google-apps.folder",
    url: f.webViewLink ?? null,
    modifiedTime: f.modifiedTime ?? null,
  }));
}

export async function driveAddReference(userId: string, projectSlug: string, fileId: string) {
  // Vérifie que le fichier est dans un dossier autorisé du projet.
  const { data: pc } = await supabaseAdmin
    .from("project_connectors")
    .select("allowed_folders, account_id")
    .eq("user_id", userId)
    .eq("project_slug", projectSlug)
    .eq("connector_id", "google_drive")
    .maybeSingle();
  const allowed = ((pc?.allowed_folders as { id: string }[] | null) ?? []).map((f) => f.id);
  const f = await driveCall<DriveFile & { parents?: string[] }>(`/files/${encodeURIComponent(fileId)}`, {
    fields: `${FILE_FIELDS},parents`,
  });
  if (!allowed.length || !(f.parents ?? []).some((p) => allowed.includes(p))) {
    throw new Error("Ce fichier n'est pas dans un dossier autorisé pour ce projet.");
  }
  const { data, error } = await supabaseAdmin
    .from("connected_objects")
    .upsert(
      {
        user_id: userId,
        project_slug: projectSlug,
        account_id: pc?.account_id ?? null,
        source: "google_drive",
        kind: "drive_file",
        external_id: f.id,
        ...driveToObject(f),
      },
      { onConflict: "user_id,project_slug,source,external_id" },
    )
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await supabaseAdmin
    .from("connected_object_raw")
    .upsert({ object_id: data.id, user_id: userId, payload: f as never, fetched_at: new Date().toISOString() });
  return { id: data.id as string };
}

/** Suppression volontaire des données synchronisées pour un projet. */
export async function purgeConnectorData(userId: string, connectorId: string, projectSlug: string) {
  if (connectorId === "google_drive") {
    await supabaseAdmin.from("connected_objects").delete().eq("user_id", userId).eq("project_slug", projectSlug).eq("source", "google_drive");
    return { ok: true };
  }
  if (connectorId === "gumroad") {
    await supabaseAdmin.from("sales").delete().eq("user_id", userId).eq("source", "gumroad");
    return { ok: true };
  }
  if (connectorId === "pinterest") {
    await supabaseAdmin.from("pins").delete().eq("user_id", userId).like("external_id", "rapport:%");
    return { ok: true };
  }
  throw new Error("Aucune donnée à supprimer pour ce connecteur.");
}
