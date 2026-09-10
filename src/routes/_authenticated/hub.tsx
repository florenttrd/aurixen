import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowUpRight, CalendarDays, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Shell, SectionTitle, StatCard } from "@/components/aurixen/Shell";
import { HUB_NAV } from "@/components/aurixen/navs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  const [newProject, setNewProject] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; name: string } | null>(null);
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
      const { error } = await supabase.from("projects").delete().eq("id", toDelete.id);
      if (error) {
        toast.error(error.message);
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

  async function createProject() {
    if (!newProject?.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const slug = newProject
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const { error } = await supabase
      .from("projects")
      .insert({ user_id: userData.user.id, slug, name: newProject.trim() });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Projet ajouté");
    setNewProject(null);
    refetch();
  }

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
        {extra.map((p) => (
          <li key={p.id} className="surface-panel flex items-center gap-3 p-4">
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-semibold">{p.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                Espace en préparation · {p.tagline ?? "Nouveau projet"}
              </span>
            </span>
            <button
              type="button"
              aria-label={`Supprimer le projet ${p.name}`}
              onClick={() => {
                setToDelete({ id: p.id, name: p.name });
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
            onClick={() => setNewProject("")}
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-sm text-muted-foreground active:bg-muted"
          >
            <Plus className="size-4" /> Ajouter un projet
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

      <Dialog open={newProject !== null} onOpenChange={(v) => !v && setNewProject(null)}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>Nouveau projet</DialogTitle>
          </DialogHeader>
          <Input
            className="h-12"
            placeholder="Nom du projet"
            value={newProject ?? ""}
            onChange={(e) => setNewProject(e.target.value)}
          />
          <DialogFooter>
            <Button className="h-12 w-full rounded-xl" onClick={createProject}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
