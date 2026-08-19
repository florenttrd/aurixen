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
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());

  function resetErrors() {
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
    setInfo(null);
  }

  function mapError(message: string) {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials")) {
      setFormError("Adresse email ou mot de passe incorrect.");
      return;
    }
    if (m.includes("email not confirmed")) {
      setFormError("Cette adresse email n'est pas encore confirmée.");
      return;
    }
    if (m.includes("user already registered") || m.includes("already been registered")) {
      setEmailError("Un accès existe déjà avec cette adresse email.");
      return;
    }
    if (m.includes("invalid") && m.includes("email")) {
      setEmailError("Adresse email invalide.");
      return;
    }
    if (m.includes("password")) {
      setPasswordError(
        m.includes("weak") || m.includes("pwned") || m.includes("compromis")
          ? "Mot de passe trop faible ou compromis. Choisissez-en un autre."
          : "Mot de passe invalide (6 caractères minimum).",
      );
      return;
    }
    if (m.includes("rate limit") || m.includes("security purposes")) {
      setFormError("Trop de tentatives. Patientez une minute avant de réessayer.");
      return;
    }
    setFormError(message);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    resetErrors();

    let invalid = false;
    if (!email.trim()) {
      setEmailError("Veuillez saisir votre adresse email.");
      invalid = true;
    } else if (!emailValid) {
      setEmailError("Adresse email invalide.");
      invalid = true;
    }
    if (!password) {
      setPasswordError("Veuillez saisir votre mot de passe.");
      invalid = true;
    } else if (password.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères.");
      invalid = true;
    }
    if (invalid) return;

    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.navigate({ to: "/hub" });
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/hub` },
        });
        if (error) throw error;
        toast.success("Compte créé. Vous pouvez vous connecter.");
        setInfo("Compte créé. Connectez-vous avec ces identifiants.");
        setMode("in");
      }
    } catch (err) {
      mapError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setBusy(false);
    }
  }

  async function forgotPassword() {
    resetErrors();
    if (!emailValid) {
      setEmailError("Saisissez d'abord une adresse email valide.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setInfo("Email de réinitialisation envoyé. Vérifiez votre boîte de réception.");
    } catch (err) {
      mapError(err instanceof Error ? err.message : "Envoi impossible");
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

        <form onSubmit={submit} noValidate className="surface-panel mt-8 space-y-4 p-5">
          {formError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
            >
              {formError}
            </p>
          ) : null}
          {info ? (
            <p
              role="status"
              className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-medium text-primary"
            >
              {info}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={!!emailError}
              className={`h-12 ${emailError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError(null);
              }}
            />
            {emailError ? (
              <p role="alert" className="text-xs font-medium text-destructive">
                {emailError}
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              aria-invalid={!!passwordError}
              className={`h-12 ${passwordError ? "border-destructive focus-visible:ring-destructive" : ""}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(null);
              }}
            />
            {passwordError ? (
              <p role="alert" className="text-xs font-medium text-destructive">
                {passwordError}
              </p>
            ) : null}
          </div>
          <Button type="submit" disabled={busy} className="h-13 w-full rounded-xl py-3.5">
            {busy ? "…" : mode === "in" ? "Se connecter" : "Créer le compte"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => {
            resetErrors();
            setMode(mode === "in" ? "up" : "in");
          }}
          className="mt-5 w-full text-center text-xs text-muted-foreground underline underline-offset-4"
        >
          {mode === "in" ? "Créer un accès" : "J'ai déjà un accès"}
        </button>

        <button
          type="button"
          onClick={forgotPassword}
          disabled={busy}
          className="mt-3 w-full text-center text-xs text-muted-foreground underline underline-offset-4"
        >
          Mot de passe oublié ?
        </button>
      </div>
    </div>
  );
}
