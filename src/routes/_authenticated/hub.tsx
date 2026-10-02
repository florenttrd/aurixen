import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, CalendarDays, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { ProjectWizard } from "@/components/aurixen/ProjectWizard";
import { Shell, SectionTitle, StatCard } from "@/components/aurixen/Shell";
import { HUB_NAV } from "@/components/aurixen/navs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDeleteProject } from "@/hooks/useProjectSystem";
import { supabase } from "@/integrations/supabase/client";
import { useEvents, usePins, useRestaurants, useSales } from "@/hooks/useAurixen";
import { PROJECTS, formatDate, formatMoney, toISODate } from "@/lib/aurixen";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/hub")({
  component: Hub,
});

function useExtraProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("projects").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

function Hub() {
  const { data: events = [] } = useEvents();
  const { data: pins = [] } = usePins();
  const { data: sales = [] } = useSales();
  const { data: restaurants = [] } = useRestaurants();
  const { data: extra = [], refetch } = useExtraProjects();
  const deleteProject = useDeleteProject();
  const [wizard, setWizard] = useState(false);
  const [toDelete, setToDelete] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [confirmName, setConfirmName] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  function closeDelete() {
    setToDelete(null);
    setStep(1);
    setConfirmName("");
    setPassword("");
  }

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email;
      if (!email) {
        toast.error("Session expirée, reconnectez-vous.");
        return;
      }
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) {
        toast.error("Mot de passe incorrect.");
        return;
      }
      try {
        await deleteProject.mutateAsync({ id: toDelete.id, slug: toDelete.slug });
      } catch {
        return;
      }
      toast.success(`Projet « ${toDelete.name} » supprimé définitivement`);
      closeDelete();
      refetch();
    } finally {
      setDeleting(false);
    }
  }

  const todayIso = toISODate(new Date());
  const upcoming = events.filter((e) => e.event_date >= todayIso).slice(0, 4);
  const revenue = sales.reduce((sum, s) => sum + Number(s.amount), 0);

  return (
    <Shell wordmark="Aurixen" subtitle="Centre de pilotage" nav={HUB_NAV}>
      <section className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Hub central</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight">
          Tous vos projets, <span className="gradient-text">un seul système</span>
        </h1>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatCard label="Revenus" value={formatMoney(revenue)} hint={`${sales.length} ventes`} />
          <StatCard
            label="Pins"
            value={String(pins.length)}
            hint={`${pins.filter((p) => p.status === "publie").length} publiés`}
          />
          <StatCard label="Restaurants" value={String(restaurants.length)} hint="Base Danse du Lion" />
          <StatCard label="Événements" value={String(events.length)} hint="Tous projets" />
        </div>
      </section>

      <SectionTitle overline="Espaces de travail" title="Projets" />
      <ul className="space-y-3">
        {PROJECTS.map((project) => (
          <li key={project.slug}>
            <Link
              to={project.to}
              className="surface-panel relative flex items-center gap-4 overflow-hidden p-4 active:opacity-90"
            >
              <span
                className="absolute inset-y-0 left-0 w-1"
                style={{ backgroundColor: project.swatch }}
              />
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold"
                style={{
                  backgroundColor: `${project.swatch}22`,
                  color: project.swatch,
                }}
              >
                {project.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold">{project.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {project.tagline}
                </span>
              </span>
              <ArrowUpRight className="size-5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
        {extra
          .filter((p) => !PROJECTS.some((b) => b.slug === p.slug))
          .map((p) => (
          <li key={p.id} className="surface-panel relative flex items-center gap-3 overflow-hidden p-4">
            <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: p.accent }} />
            <Link to="/p/$slug" params={{ slug: p.slug }} className="flex min-w-0 flex-1 items-center gap-4 active:opacity-90">
              <span
                className="flex size-12 shrink-0 items-center justify-center rounded-xl text-base font-bold"
                style={{ backgroundColor: `${p.accent}22`, color: p.accent }}
              >
                {p.initials ?? p.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-semibold">{p.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {p.subtitle ?? p.tagline ?? "Espace personnalisé"}
                </span>
              </span>
            </Link>
            <button
              type="button"
              aria-label={`Supprimer le projet ${p.name}`}
              onClick={() => {
                setToDelete({ id: p.id, name: p.name, slug: p.slug });
                setStep(1);
                setConfirmName("");
                setPassword("");
              }}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-destructive active:bg-muted"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={() => setWizard(true)}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-sm text-muted-foreground active:bg-muted"
          >
            <Plus className="size-4" /> Créer un projet
          </button>
        </li>
      </ul>

      <section className="mt-8">
        <SectionTitle overline="Vision d'ensemble" title="À venir" />
        {upcoming.length === 0 ? (
          <div className="surface-panel p-5 text-sm text-muted-foreground">
            Aucun événement planifié.{" "}
            <Link to="/calendrier" className="text-primary underline underline-offset-4">
              Ouvrir le calendrier global
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((e) => (
              <li key={e.id} className="surface-panel flex items-center gap-3 p-3">
                <CalendarDays className="size-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{e.title}</span>
                  <span className="block text-xs text-muted-foreground">
                    {formatDate(e.event_date)}
                    {e.event_time ? ` · ${e.event_time.slice(0, 5)}` : ""}
                  </span>
                </span>
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      PROJECTS.find((p) => p.slug === e.project_slug)?.swatch ?? "#c9a84c",
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ProjectWizard open={wizard} onOpenChange={setWizard} />

      <Dialog open={toDelete !== null} onOpenChange={(v) => !v && closeDelete()}>
        <DialogContent className="top-4 translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-destructive" />
              Supprimer un projet
            </DialogTitle>
          </DialogHeader>
          {toDelete ? (
            step === 1 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Cette action est définitive et irréversible. Pour confirmer, écrivez exactement le
                  nom du projet&nbsp;: <span className="font-semibold text-foreground">{toDelete.name}</span>
                </p>
                <Input
                  className="h-12"
                  placeholder="Nom du projet"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                />
                <Button
                  variant="destructive"
                  className="h-12 w-full rounded-xl"
                  disabled={confirmName.trim() !== toDelete.name}
                  onClick={() => setStep(2)}
                >
                  Continuer
                </Button>
                <Button variant="ghost" className="h-11 w-full rounded-xl" onClick={closeDelete}>
                  Annuler
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Dernière étape&nbsp;: saisissez votre mot de passe Aurixen pour supprimer
                  définitivement «&nbsp;{toDelete.name}&nbsp;».
                </p>
                <Input
                  type="password"
                  autoComplete="current-password"
                  className="h-12"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  variant="destructive"
                  className="h-12 w-full rounded-xl"
                  disabled={password.length < 6 || deleting}
                  onClick={confirmDelete}
                >
                  {deleting ? "Suppression…" : "Supprimer définitivement"}
                </Button>
                <Button
                  variant="ghost"
                  className="h-11 w-full rounded-xl"
                  onClick={() => setStep(1)}
                >
                  Retour
                </Button>
              </div>
            )
          ) : null}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
