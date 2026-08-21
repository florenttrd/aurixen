import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { IntegrationPublic } from "./integrations.server";

export const getIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<IntegrationPublic[]> => {
    const { publicStatus } = await import("./integrations.server");
    return publicStatus(context.userId);
  });

export const startPinterestOAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const mod = await import("./integrations.server");
    const cfg = mod.pinterestConfig();
    if (cfg.missing.length) {
      return { url: null as string | null, missing: cfg.missing };
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const state = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabaseAdmin.from("oauth_states").insert({
      state,
      user_id: context.userId,
      provider: "pinterest",
      redirect_uri: cfg.redirectUri,
    });
    if (error) throw new Error(error.message);
    return { url: mod.PinterestService.authorizeUrl(state), missing: [] as string[] };
  });

export const syncPinterestNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const mod = await import("./integrations.server");
    await mod.setStatus(context.userId, "pinterest", "syncing");
    try {
      return await mod.syncPinterest(context.userId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue";
      await mod.setStatus(context.userId, "pinterest", "error", message);
      throw new Error(message);
    }
  });

export const testGumroadNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const mod = await import("./integrations.server");
    try {
      return await mod.testGumroad(context.userId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue";
      await mod.setStatus(context.userId, "gumroad", "error", message);
      throw new Error(message);
    }
  });

export const syncGumroadNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const mod = await import("./integrations.server");
    await mod.setStatus(context.userId, "gumroad", "syncing");
    try {
      return await mod.syncGumroad(context.userId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erreur inconnue";
      await mod.setStatus(context.userId, "gumroad", "error", message);
      throw new Error(message);
    }
  });

export const disconnectIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { provider: "pinterest" | "gumroad" }) => {
    if (input.provider !== "pinterest" && input.provider !== "gumroad") {
      throw new Error("Service inconnu");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("integrations")
      .delete()
      .eq("user_id", context.userId)
      .eq("provider", data.provider);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
