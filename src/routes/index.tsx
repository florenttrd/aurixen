import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aurixen — Système central de pilotage entrepreneurial" },
      {
        name: "description",
        content:
          "Aurixen centralise vos projets entrepreneuriaux : idées, stratégies, analytics, calendriers et fichiers dans un seul centre de contrôle privé.",
      },
      { property: "og:title", content: "Aurixen — Centre de pilotage entrepreneurial" },
      {
        property: "og:description",
        content:
          "Un seul site, tous vos projets, un espace adapté à chacun. Penser, organiser, créer, analyser, décider.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="veil pointer-events-none absolute inset-x-0 top-0 h-[60vh]" />

      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <p className="brand-wordmark text-[11px] text-primary">Système privé</p>
        <h1 className="brand-wordmark mt-4 text-5xl leading-[0.95] sm:text-6xl">
          <span className="gradient-text">Aurixen</span>
        </h1>
        <div className="hairline mt-6 h-px" />
        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Gestion, organisation et pilotage de l'ensemble de votre activité entrepreneuriale.
          Chaque projet, son propre univers — une seule interface centrale.
        </p>

        <ul className="mt-8 space-y-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <li>Penser · Organiser · Créer</li>
          <li>Analyser · Décider · Planifier</li>
        </ul>

        <div className="mt-10 space-y-3">
          <Link
            to="/hub"
            className="glow flex h-14 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground"
          >
            Entrer <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/auth"
            className="flex h-14 items-center justify-center rounded-2xl border border-border text-sm font-medium text-muted-foreground"
          >
            Connexion
          </Link>
        </div>
      </main>

      <footer className="relative pb-8 text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        Accès privé
      </footer>
    </div>
  );
}
