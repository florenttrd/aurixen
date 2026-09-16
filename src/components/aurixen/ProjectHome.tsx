import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BarChart3, CalendarDays, Images, Receipt, Store } from "lucide-react";
import type { ReactNode } from "react";

import { SectionTitle } from "./Shell";
import { useFiles } from "@/hooks/useAurixen";
import { useJournal, useModuleRecords, useTasks } from "@/hooks/useModuleData";
import { supabase } from "@/integrations/supabase/client";
import { UNIVERSAL_MODULES, findModuleDef, HOME_BLOCK_LABELS } from "@/lib/modules";
import { formatDate } from "@/lib/aurixen";
import type { Project, ProjectModule } from "@/hooks/useProjectSystem";

function blockHref(slug: string, key: string) {
  const u = UNIVERSAL_MODULES.find((m) => m.key === key);
  if (u) return u.path ? `/p/${slug}/${u.path}` : `/p/${slug}`;
  return `/p/${slug}/m/${key}`;
}
function blockTitle(key: string) {
  return HOME_BLOCK_LABELS[key] ?? findModuleDef(key)?.label ?? key;
}
function span(size: string) {
  return size === "petit" ? "sm:col-span-1" : "sm:col-span-2";
}

function Card({ slug, moduleKey, size, children }: { slug: string; moduleKey: string; size: string; children: ReactNode }) {
  return (
    <Link to={blockHref(slug, moduleKey)} className={`surface-panel flex flex-col gap-2 p-4 active:opacity-90 ${span(size)}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{blockTitle(moduleKey)}</span>
        <ArrowUpRight className="size-4 text-muted-foreground" />
      </div>
      {children}
    </Link>
  );
}

function TasksBlock({ slug, size }: { slug: string; size: string }) {
  const { data: tasks = [] } = useTasks(slug);
  const open = tasks.filter((t) => !t.done).slice(0, 3);
  return (
    <Card slug={slug} moduleKey="taches" size={size}>
      <p className="text-2xl font-semibold tabular-nums">{tasks.filter((t) => !t.done).length}</p>
      <ul className="space-y-0.5">{open.map((t) => <li key={t.id} className="truncate text-xs text-muted-foreground">· {t.title}</li>)}</ul>
    </Card>
  );
}
function CalendrierBlock({ slug, size }: { slug: string; size: string }) {
  const { data: events = [] } = useQuery({
    queryKey: ["home-events", slug],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase.from("events").select("*").eq("project_slug", slug).gte("event_date", today).order("event_date").limit(3);
      return (data ?? []) as { id: string; event_date: string; title: string }[];
    },
  });
  return (
    <Card slug={slug} moduleKey="calendrier" size={size}>
      <p className="text-2xl font-semibold tabular-nums">{events.length}</p>
      <ul className="space-y-0.5">{events.map((e) => <li key={e.id} className="truncate text-xs text-muted-foreground">{formatDate(e.event_date)} · {e.title}</li>)}</ul>
    </Card>
  );
}
function JournalBlock({ slug, size }: { slug: string; size: string }) {
  const { data: entries = [] } = useJournal(slug);
  return (
    <Card slug={slug} moduleKey="journal" size={size}>
      <p className="text-2xl font-semibold tabular-nums">{entries.length}</p>
      <ul className="space-y-0.5">{entries.slice(0, 2).map((e) => <li key={e.id} className="truncate text-xs text-muted-foreground">· {e.title || "Sans titre"}</li>)}</ul>
    </Card>
  );
}
function NotesBlock({ slug, size }: { slug: string; size: string }) {
  const { data: notes = [] } = useQuery({
    queryKey: ["home-notes", slug],
    queryFn: async () => {
      const { data } = await supabase.from("notes").select("*").eq("project_slug", slug).order("created_at", { ascending: false }).limit(2);
      return (data ?? []) as { id: string; title: string }[];
    },
  });
  return (
    <Card slug={slug} moduleKey="notes" size={size}>
      <p className="text-2xl font-semibold tabular-nums">{notes.length}</p>
      <ul className="space-y-0.5">{notes.map((n) => <li key={n.id} className="truncate text-xs text-muted-foreground">· {n.title || "Note"}</li>)}</ul>
    </Card>
  );
}
function FilesBlock({ slug, size }: { slug: string; size: string }) {
  const { data: files = [] } = useFiles(slug);
  return (
    <Card slug={slug} moduleKey="fichiers" size={size}>
      <p className="text-2xl font-semibold tabular-nums">{files.length}</p>
      <p className="truncate text-xs text-muted-foreground">{files[0]?.name ?? "Aucun fichier"}</p>
    </Card>
  );
}
function RecordsBlock({ slug, moduleKey, size }: { slug: string; moduleKey: string; size: string }) {
  const { data: records = [] } = useModuleRecords(slug, moduleKey);
  return (
    <Card slug={slug} moduleKey={moduleKey} size={size}>
      <p className="text-2xl font-semibold tabular-nums">{records.length}</p>
      <p className="truncate text-xs text-muted-foreground">{records[0]?.title ?? "Aucune fiche"}</p>
    </Card>
  );
}

function BlockRenderer({ slug, moduleKey, size }: { slug: string; moduleKey: string; size: string }) {
  switch (moduleKey) {
    case "taches": return <TasksBlock slug={slug} size={size} />;
    case "calendrier": return <CalendrierBlock slug={slug} size={size} />;
    case "journal": return <JournalBlock slug={slug} size={size} />;
    case "notes": return <NotesBlock slug={slug} size={size} />;
    case "fichiers": return <FilesBlock slug={slug} size={size} />;
    default: return <RecordsBlock slug={slug} moduleKey={moduleKey} size={size} />;
  }
}

const SPECIALIZED_LINKS: Record<string, { to: string; label: string; icon: ReactNode }[]> = {
  "leo-valen": [
    { to: "/leo/pins", label: "Bibliothèque de pins", icon: <Images className="size-5" /> },
    { to: "/leo/ventes", label: "Ventes", icon: <Receipt className="size-5" /> },
    { to: "/leo/analytics", label: "Analytics Pinterest", icon: <BarChart3 className="size-5" /> },
  ],
  "danse-du-lion": [
    { to: "/lion/restaurants", label: "Restaurants", icon: <Store className="size-5" /> },
    { to: "/lion/calendrier", label: "Prestations & calendrier", icon: <CalendarDays className="size-5" /> },
  ],
};

export function ProjectHome({ project, modules, slug }: { project: Project; modules: ProjectModule[]; slug: string }) {
  const layout = project.home_layout ?? [];
  const specialized = SPECIALIZED_LINKS[slug] ?? [];
  return (
    <>
      <section className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">{project.tagline ?? "Espace de travail"}</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight">{project.name}</h1>
      </section>

      {layout.length === 0 ? (
        <p className="surface-panel p-5 text-sm text-muted-foreground">
          Aucun bloc configuré. Allez dans Réglages → Accueil pour personnaliser cette page.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {layout.map((b, i) => (
            <BlockRenderer key={`${b.module}-${i}`} slug={slug} moduleKey={b.module} size={b.size} />
          ))}
        </div>
      )}

      {specialized.length > 0 ? (
        <section className="mt-8">
          <SectionTitle overline="Spécifique au projet" title="Modules spécialisés" />
          <ul className="space-y-2">
            {specialized.map((s) => (
              <li key={s.to}>
                <Link to={s.to} className="surface-panel flex items-center gap-3 p-4 active:opacity-90">
                  <span className="text-primary">{s.icon}</span>
                  <span className="flex-1 text-sm font-medium">{s.label}</span>
                  <ArrowUpRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
