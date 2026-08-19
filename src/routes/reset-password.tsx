import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — Aurixen" },
      {
        name: "description",
        content: "Définissez un nouveau mot de passe pour votre accès privé Aurixen.",
      },
      { property: "og:title", content: "Nouveau mot de passe — Aurixen" },
      { property: "og:description", content: "Réinitialisation du mot de passe Aurixen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setBusy(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      router.navigate({ to: "/hub" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de mettre à jour le mot de passe.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="veil pointer-events-none absolute inset-x-0 top-0 h-[50vh]" />
      <div className="relative w-full max-w-sm">
        <h1 className="brand-wordmark text-center text-3xl">
          <span className="gradient-text">Aurixen</span>
        </h1>
        <p className="mt-2 text-center text-xs uppercase tracking-[0.28em] text-muted-foreground">
          Nouveau mot de passe
        </p>

        <form onSubmit={submit} noValidate className="surface-panel mt-8 space-y-4 p-5">
          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
            >
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="new-password">Mot de passe</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              className="h-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmation</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              className="h-12"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy} className="h-13 w-full rounded-xl py-3.5">
            {busy ? "…" : "Enregistrer"}
          </Button>
        </form>
      </div>
    </div>
  );
}
