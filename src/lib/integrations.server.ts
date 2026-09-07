// Server-only integration services. Tokens never leave this module.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Provider = "pinterest" | "gumroad";
export type IntegrationStatus = "disconnected" | "connected" | "syncing" | "error";

export type IntegrationPublic = {
  provider: Provider;
  status: IntegrationStatus;
  account_label: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  configured: boolean;
  missing_secrets: string[];
};

/* --------------------------- secrets / config ---------------------------- */

export function pinterestConfig() {
  const clientId = process.env["PINTEREST_CLIENT_ID"] ?? "";
  const clientSecret = process.env["PINTEREST_CLIENT_SECRET"] ?? "";
  const redirectUri = process.env["PINTEREST_REDIRECT_URI"] ?? "";
  const missing = [
    ...(clientId ? [] : ["PINTEREST_CLIENT_ID"]),
    ...(clientSecret ? [] : ["PINTEREST_CLIENT_SECRET"]),
    ...(redirectUri ? [] : ["PINTEREST_REDIRECT_URI"]),
  ];
  return { clientId, clientSecret, redirectUri, missing };
}

export function gumroadConfig() {
  const token = process.env["GUMROAD_ACCESS_TOKEN"] ?? "";
  return { token, missing: token ? [] : ["GUMROAD_ACCESS_TOKEN"] };
}

/* ------------------------------ persistence ------------------------------ */

type Row = {
  provider: string;
  status: string;
  account_label: string | null;
  last_sync_at: string | null;
  last_error: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
};

export async function readIntegration(userId: string, provider: Provider) {
  const { data } = await supabaseAdmin
    .from("integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", provider)
    .maybeSingle();
  return (data as Row | null) ?? null;
}

export async function upsertIntegration(
  userId: string,
  provider: Provider,
  patch: Record<string, unknown>,
) {
  const { error } = await supabaseAdmin
    .from("integrations")
    .upsert({ user_id: userId, provider, ...patch }, { onConflict: "user_id,provider" });
  if (error) throw new Error(error.message);
}

export async function setStatus(
  userId: string,
  provider: Provider,
  status: IntegrationStatus,
  lastError: string | null = null,
) {
  await upsertIntegration(userId, provider, { status, last_error: lastError });
}

/** Status payload safe for the browser: never includes tokens. */
export async function publicStatus(userId: string): Promise<IntegrationPublic[]> {
  const pin = await readIntegration(userId, "pinterest");
  const gum = await readIntegration(userId, "gumroad");
  const pinCfg = pinterestConfig();
  const gumCfg = gumroadConfig();

  return [
    {
      provider: "pinterest",
      status: (pin?.status as IntegrationStatus) ?? "disconnected",
      account_label: pin?.account_label ?? null,
      last_sync_at: pin?.last_sync_at ?? null,
      last_error: pin?.last_error ?? null,
      configured: pinCfg.missing.length === 0,
      missing_secrets: pinCfg.missing,
    },
    {
      provider: "gumroad",
      status: gumCfg.missing.length
        ? "disconnected"
        : ((gum?.status as IntegrationStatus) ?? "disconnected"),
      account_label: gum?.account_label ?? null,
      last_sync_at: gum?.last_sync_at ?? null,
      last_error: gum?.last_error ?? null,
      configured: gumCfg.missing.length === 0,
      missing_secrets: gumCfg.missing,
    },
  ];
}

function isoDay(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/* ---------------------------- GumroadService ----------------------------- */

const GUMROAD_API = "https://api.gumroad.com/v2";

export const GumroadService = {
  async call<T>(path: string): Promise<T> {
    const { token, missing } = gumroadConfig();
    if (missing.length) throw new Error("GUMROAD_ACCESS_TOKEN n'est pas configuré");
    const res = await fetch(`${GUMROAD_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
    if (!res.ok || json.success === false) {
      throw new Error(json.message ?? `Gumroad API ${res.status}`);
    }
    return json as T;
  },

  async me() {
    return this.call<{ user?: { name?: string; email?: string } }>("/user");
  },

  async sales(after: string) {
    return this.call<{
      sales?: {
        id: string;
        product_name?: string;
        price?: number;
        currency?: string;
        quantity?: number;
        created_at?: string;
      }[];
    }>(`/sales?after=${after}`);
  },
};

export async function testGumroad(userId: string) {
  const me = await GumroadService.me();
  const label = me.user?.name || me.user?.email || "Compte Gumroad";
  await upsertIntegration(userId, "gumroad", {
    status: "connected",
    account_label: label,
    last_error: null,
  });
  return { label };
}

export async function syncGumroad(userId: string) {
  const after = isoDay(-365);
  const data = await GumroadService.sales(after);
  const sales = data.sales ?? [];
  for (const sale of sales) {
    const { error } = await supabaseAdmin.from("sales").upsert(
      {
        user_id: userId,
        external_id: sale.id,
        product: sale.product_name ?? "Produit Gumroad",
        amount: (sale.price ?? 0) / 100,
        currency: (sale.currency ?? "usd").toUpperCase(),
        quantity: sale.quantity ?? 1,
        sold_at: sale.created_at ?? new Date().toISOString(),
        source: "gumroad",
      },
      { onConflict: "user_id,external_id" },
    );
    if (error) throw new Error(error.message);
  }
  await upsertIntegration(userId, "gumroad", {
    status: "connected",
    last_sync_at: new Date().toISOString(),
    last_error: null,
  });
  return { imported: sales.length };
}
