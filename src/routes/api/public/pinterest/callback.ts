import { createFileRoute } from "@tanstack/react-router";

function redirect(message: string, ok: boolean) {
  const target = `/parametres/integrations?pinterest=${ok ? "ok" : "error"}&message=${encodeURIComponent(message)}`;
  return new Response(null, { status: 302, headers: { Location: target } });
}

export const Route = createFileRoute("/api/public/pinterest/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const oauthError = url.searchParams.get("error");

        if (oauthError) return redirect(`Autorisation refusée (${oauthError})`, false);
        if (!code || !state) return redirect("Réponse Pinterest incomplète", false);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: stateRow } = await supabaseAdmin
          .from("oauth_states")
          .select("*")
          .eq("state", state)
          .eq("provider", "pinterest")
          .maybeSingle();

        if (!stateRow) return redirect("Jeton d'autorisation invalide ou expiré", false);
        await supabaseAdmin.from("oauth_states").delete().eq("state", state);

        const mod = await import("@/lib/integrations.server");
        try {
          const token = await mod.PinterestService.exchangeCode(code);
          const account = await mod.PinterestService.account(token.access_token!);
          await mod.upsertIntegration(stateRow.user_id, "pinterest", {
            status: "connected",
            access_token: token.access_token!,
            refresh_token: token.refresh_token ?? null,
            token_expires_at: new Date(
              Date.now() + (token.expires_in ?? 2592000) * 1000,
            ).toISOString(),
            scopes: token.scope ?? null,
            account_label: account.username ?? "Compte Pinterest",
            last_error: null,
          });
          return redirect("Pinterest connecté", true);
        } catch (e) {
          const message = e instanceof Error ? e.message : "Erreur inconnue";
          await mod.setStatus(stateRow.user_id, "pinterest", "error", message);
          return redirect(message, false);
        }
      },
    },
  },
});
