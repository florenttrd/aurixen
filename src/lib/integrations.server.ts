// Server-only integration services. Tokens never leave this module.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type Provider = "gumroad";
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

// Pinterest n'utilise plus d'API : les statistiques arrivent par import de rapport.

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
  const gum = await readIntegration(userId, "gumroad");
  const gumCfg = gumroadConfig();

  return [
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

/* ---------------------------- GumroadService ----------------------------- */

const GUMROAD_API = "https://api.gumroad.com/v2";

type GumroadSale = {
  id: string;
  product_name?: string;
  price?: number;
  currency?: string;
  quantity?: number;
  created_at?: string;
};

export const GumroadService = {
  async call<T>(pathOrUrl: string): Promise<T> {
    const { token, missing } = gumroadConfig();
    if (missing.length) throw new Error("GUMROAD_ACCESS_TOKEN n'est pas configuré");
    const url = pathOrUrl.startsWith("http") ? pathOrUrl : `${GUMROAD_API}${pathOrUrl}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = (await res.json().catch(() => ({}))) as { success?: boolean; message?: string };
    if (res.status === 401) throw new Error("Jeton Gumroad refusé : vérifiez-le puis réessayez.");
    if (!res.ok || json.success === false) {
      throw new Error(json.message ?? `Gumroad API ${res.status}`);
    }
    return json as T;
  },

  async me() {
    return this.call<{ user?: { name?: string; email?: string } }>("/user");
  },

  /** Toutes les ventes, page par page. */
  async allSales() {
    const out: GumroadSale[] = [];
    let next: string | null = "/sales";
    let guard = 0;
    while (next && guard < 50) {
      const page: { sales?: GumroadSale[]; next_page_url?: string | null } = await this.call(next);
      out.push(...(page.sales ?? []));
      const url: string | null = page.next_page_url ?? null;
      next = url ? (url.startsWith("http") ? url : `https://api.gumroad.com${url}`) : null;
      guard += 1;
    }
    return out;
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
  const sales = await GumroadService.allSales();
  const rows = sales.map((sale) => ({
    user_id: userId,
    external_id: sale.id,
    product: sale.product_name?.trim() || "Produit Gumroad",
    amount: (sale.price ?? 0) / 100,
    currency: (sale.currency ?? "eur").toUpperCase(),
    quantity: sale.quantity ?? 1,
    sold_at: sale.created_at ?? new Date().toISOString(),
    source: "gumroad",
  }));

  if (rows.length) {
    const { error } = await supabaseAdmin
      .from("sales")
      .upsert(rows, { onConflict: "user_id,external_id" });
    if (error) throw new Error(error.message);
  }

  await upsertIntegration(userId, "gumroad", {
    status: "connected",
    last_sync_at: new Date().toISOString(),
    last_error: null,
  });
  return { imported: rows.length };
}
