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

/* --------------------------- PinterestService ---------------------------- */

const PINTEREST_API = "https://api.pinterest.com/v5";
const PINTEREST_SCOPES = "user_accounts:read,pins:read,boards:read";

export const PinterestService = {
  authorizeUrl(state: string) {
    const { clientId, redirectUri } = pinterestConfig();
    const url = new URL("https://www.pinterest.com/oauth/");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", PINTEREST_SCOPES);
    url.searchParams.set("state", state);
    return url.toString();
  },

  async exchangeCode(code: string) {
    const { clientId, clientSecret, redirectUri } = pinterestConfig();
    const res = await fetch(`${PINTEREST_API}/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });
    const json = (await res.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      message?: string;
    };
    if (!res.ok || !json.access_token) {
      throw new Error(json.message ?? `Échec de l'échange du code (HTTP ${res.status})`);
    }
    return json;
  },

  async refresh(refreshToken: string) {
    const { clientId, clientSecret } = pinterestConfig();
    const res = await fetch(`${PINTEREST_API}/oauth/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    });
    const json = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
      message?: string;
    };
    if (!res.ok || !json.access_token) {
      throw new Error(json.message ?? "Impossible de renouveler le jeton Pinterest");
    }
    return json;
  },

  async call<T>(token: string, path: string): Promise<T> {
    const res = await fetch(`${PINTEREST_API}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      throw new Error(body.message ?? `Pinterest API ${res.status}`);
    }
    return (await res.json()) as T;
  },

  async account(token: string) {
    return this.call<{ username?: string; account_type?: string }>(token, "/user_account");
  },
};

/** Returns a valid access token, refreshing it when needed. */
async function pinterestToken(userId: string) {
  const row = await readIntegration(userId, "pinterest");
  if (!row?.access_token) throw new Error("Pinterest n'est pas connecté");
  const expired = row.token_expires_at ? new Date(row.token_expires_at) <= new Date() : false;
  if (!expired) return row.access_token;
  if (!row.refresh_token) throw new Error("Jeton Pinterest expiré, reconnectez le compte");
  const refreshed = await PinterestService.refresh(row.refresh_token);
  await upsertIntegration(userId, "pinterest", {
    access_token: refreshed.access_token!,
    token_expires_at: new Date(Date.now() + (refreshed.expires_in ?? 2592000) * 1000).toISOString(),
  });
  return refreshed.access_token!;
}

type PinterestPin = {
  id: string;
  title?: string | null;
  description?: string | null;
  link?: string | null;
  board_id?: string | null;
  created_at?: string | null;
  media?: { images?: Record<string, { url?: string }> };
};

function isoDay(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/** Imports pins + their analytics into public.pins. */
export async function syncPinterest(userId: string) {
  const token = await pinterestToken(userId);
  const pins = await PinterestService.call<{ items?: PinterestPin[] }>(
    token,
    "/pins?page_size=100",
  );
  const items = pins.items ?? [];
  let imported = 0;

  for (const pin of items) {
    let impressions = 0;
    let saves = 0;
    let clicks = 0;
    let outbound = 0;
    try {
      const analytics = await PinterestService.call<
        Record<string, { lifetime_metrics?: Record<string, number> }>
      >(
        token,
        `/pins/${pin.id}/analytics?start_date=${isoDay(-89)}&end_date=${isoDay(0)}` +
          `&metric_types=IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK`,
      );
      const metrics = analytics["all"]?.lifetime_metrics ?? {};
      impressions = metrics["IMPRESSION"] ?? 0;
      saves = metrics["SAVE"] ?? 0;
      clicks = metrics["PIN_CLICK"] ?? 0;
      outbound = metrics["OUTBOUND_CLICK"] ?? 0;
    } catch {
      // analytics can be unavailable for very recent pins — keep the pin anyway
    }

    const image =
      pin.media?.images?.["600x"]?.url ??
      Object.values(pin.media?.images ?? {})[0]?.url ??
      null;

    const { error } = await supabaseAdmin.from("pins").upsert(
      {
        user_id: userId,
        external_id: pin.id,
        title: pin.title?.trim() || "Pin Pinterest",
        description: pin.description ?? null,
        image_url: image,
        board: pin.board_id ?? null,
        status: "publie",
        published_at: pin.created_at ?? null,
        impressions,
        saves,
        clicks,
        outbound_clicks: outbound,
      },
      { onConflict: "user_id,external_id" },
    );
    if (error) throw new Error(error.message);
    imported += 1;
  }

  await upsertIntegration(userId, "pinterest", {
    status: "connected",
    last_sync_at: new Date().toISOString(),
    last_error: null,
  });
  return { imported };
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
