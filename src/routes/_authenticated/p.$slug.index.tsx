import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowUpRight, Settings2 } from "lucide-react";
import type { ReactNode } from "react";

import { moduleHref, projectHref } from "@/components/aurixen/ProjectShell";
import { useEvents, useFiles, useNotes } from "@/hooks/useAurixen";
import { useJournal, useModuleRecords, useTasks } from "@/hooks/useModuleData";
import { useProject, useProjectModules, type ProjectModule } from "@/hooks/useProjectSystem";
import { formatDate, toISODate } from "@/lib/aurixen";
import { HOME_BLOCK_LABELS, type HomeBlock } from "@/lib/modules";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/p/$slug/")({
  component: ProjectHome,
});

function ProjectHome() {
  const { slug } = Route.useParams();
  const { data: project } = useProject(slug);
  const { data: modules = [] } = useProjectModules(slug);
  if (!project) return null;

  const enabled = modules.filter((m) => m.enabled);
  const blocks = project.home_layout.filter((b) => enabled.some((m) => m.module_key === b.module));
  const compact = project.home_density === "liste";

  return (
    <div>
      <section className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Accueil</p>
        <h1 className="font-display mt-2 text-3xl font-semibold leading-tight">{project.name}</h1>
        {project.subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{project.subtitle}</p>
        ) : null}
      </section>

      {blocks.length === 0 ? (
        <div className="surface-panel p-5 text-sm text-muted-foreground">
          Votre accueil est vide.{" "}
          <Link to={projectHref(slug, "reglages")} className="text-primary underline underline-offset-4">
            Choisir les blocs à afficher
          </Link>
        </div>
      ) : (
        <div className={cn("grid gap-3", compact ? "grid-cols-1" : "grid-cols-2")}>
          {blocks.map((block) => {
            const mod = enabled.find((m) => m.module_key === block.module)!;
            return <HomeBlockView key={block.module} slug={slug} block={block} mod={mod} compact={compact} />;
          })}
        </div>
      )}

      <Link
        to={projectHref(slug, "reglages")}
        className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-sm text-muted-foreground active:bg-muted"
      >
        <Settings2 className="size-4" /> Personnaliser l'accueil
      </Link>
    </div>
  );
}

function limitFor(size: HomeBlock["size"]) {
  return size === "grand" ? 6 : size === "moyen" ? 3 : 0;
}

function HomeBlockView({
  slug,
  block,
  mod,
  compact,
}: {
  slug: string;
  block: HomeBlock;
  mod: ProjectModule;
  compact: boolean;
}) {
  const title = HOME_BLOCK_LABELS[block.module] ?? mod.label ?? block.module;
  const span = compact || block.size !== "petit" ? "col-span-2" : "col-span-1";
  return (
    <Link
      to={moduleHref(slug, mod)}
      className={cn("surface-panel block p-4 active:opacity-90", span)}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{title}</p>
        <ArrowUpRight className="size-4 text-muted-foreground" />
      </div>
      <BlockContent slug={slug} moduleKey={block.module} limit={limitFor(block.size)} />
    </Link>
  );
}

function Rows({ items, count, empty }: { items: { id: string; title: string; hint?: string }[]; count: number; empty: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums">{count}</p>
      {items.length ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((i) => (
            <li key={i.id} className="flex items-baseline justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate">{i.title}</span>
              {i.hint ? <span className="shrink-0 text-[11px] text-muted-foreground">{i.hint}</span> : null}
            </li>
          ))}
        </ul>
      ) : count === 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">{empty}</p>
      ) : null}
    </div>
  );
}

function BlockContent({ slug, moduleKey, limit }: { slug: string; moduleKey: string; limit: number }): ReactNode {
  switch (moduleKey) {
    case "taches":
      return <TasksBlock slug={slug} limit={limit} />;
    case "calendrier":
      return <EventsBlock slug={slug} limit={limit} />;
    case "journal":
      return <JournalBlock slug={slug} limit={limit} />;
    case "notes":
      return <NotesBlock slug={slug} limit={limit} />;
    case "fichiers":
      return <FilesBlock slug={slug} limit={limit} />;
    default:
      return <RecordsBlock slug={slug} moduleKey={moduleKey} limit={limit} />;
  }
}

function TasksBlock({ slug, limit }: { slug: string; limit: number }) {
  const { data = [] } = useTasks(slug);
  const open = data.filter((t) => !t.done);
  return (
    <Rows
      count={open.length}
      empty="Rien à faire"
      items={open.slice(0, limit).map((t) => ({ id: t.id, title: t.title, hint: t.due_date ? formatDate(t.due_date) : undefined }))}
    />
  );
}

function EventsBlock({ slug, limit }: { slug: string; limit: number }) {
  const { data = [] } = useEvents(slug);
  const today = toISODate(new Date());
  const next = data.filter((e) => e.event_date >= today);
  return (
    <Rows
      count={next.length}
      empty="Aucun événement à venir"
      items={next.slice(0, limit).map((e) => ({ id: e.id, title: e.title, hint: formatDate(e.event_date) }))}
    />
  );
}

function JournalBlock({ slug, limit }: { slug: string; limit: number }) {
  const { data = [] } = useJournal(slug);
  return (
    <Rows
      count={data.length}
      empty="Journal vide"
      items={data.slice(0, limit).map((e) => ({ id: e.id, title: e.title || "Sans titre", hint: formatDate(e.entry_date) }))}
    />
  );
}

function NotesBlock({ slug, limit }: { slug: string; limit: number }) {
  const { data = [] } = useNotes(slug);
  return (
    <Rows
      count={data.length}
      empty="Aucune note"
      items={data.slice(0, limit).map((n) => ({ id: n.id, title: n.title || "Sans titre" }))}
    />
  );
}

function FilesBlock({ slug, limit }: { slug: string; limit: number }) {
  const { data = [] } = useFiles(slug);
  return (
    <Rows count={data.length} empty="Aucun fichier" items={data.slice(0, limit).map((f) => ({ id: f.id, title: f.name }))} />
  );
}

function RecordsBlock({ slug, moduleKey, limit }: { slug: string; moduleKey: string; limit: number }) {
  const { data = [] } = useModuleRecords(slug, moduleKey);
  return (
    <Rows
      count={data.length}
      empty="Aucune fiche"
      items={data.slice(0, limit).map((r) => ({ id: r.id, title: r.title || "Sans titre", hint: r.data["statut"] }))}
    />
  );
}
