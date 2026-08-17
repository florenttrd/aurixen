import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Aurixen" },
      {
        name: "description",
        content: "Accès privé au centre de pilotage Aurixen. Connexion réservée au propriétaire.",
      },
      { property: "og:title", content: "Connexion — Aurixen" },
      { property: "og:description", content: "Accès privé au centre de pilotage Aurixen." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.navigate({ to: "/hub" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/hub` },
        });
        if (error) throw error;
        toast.success("Compte créé. Vous pouvez vous connecter.");
        setMode("in");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur de connexion");
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
          {mode === "in" ? "Accès privé" : "Créer l'accès"}
        </p>

        <form onSubmit={submit} className="surface-panel mt-8 space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="h-12"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              required
              minLength={6}
              className="h-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={busy} className="h-13 w-full rounded-xl py-3.5">
            {busy ? "…" : mode === "in" ? "Se connecter" : "Créer le compte"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "in" ? "up" : "in")}
          className="mt-5 w-full text-center text-xs text-muted-foreground underline underline-offset-4"
        >
          {mode === "in" ? "Créer un accès" : "J'ai déjà un accès"}
        </button>
      </div>
    </div>
  );
}
