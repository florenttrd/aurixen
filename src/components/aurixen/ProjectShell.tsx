import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, MoreHorizontal, Settings2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import { moduleIcon } from "./module-icons";
import { ProjectTheme } from "./ProjectTheme";
import { UNIVERSAL_MODULES } from "@/lib/modules";
import type { Project, ProjectModule } from "@/hooks/useProjectSystem";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export type ProjectNavItem = { to: string; label: string; icon: ReactNode; exact?: boolean };

export function moduleHref(slug: string, module: ProjectModule): string {
  const universal = UNIVERSAL_MODULES.find((u) => u.key === module.module_key);
  if (universal) return universal.path ? `/p/${slug}/${universal.path}` : `/p/${slug}`;
  return `/p/${slug}/m/${module.module_key}`;
}

export function projectHref(slug: string, suffix = ""): string {
  return suffix ? `/p/${slug}/${suffix}` : `/p/${slug}`;
}

export function projectNavItems(slug: string, modules: ProjectModule[]): ProjectNavItem[] {
  return modules
    .filter((m) => m.enabled)
    .map((m) => ({
      to: moduleHref(slug, m),
      label: m.label ?? m.module_key,
      icon: moduleIcon(m.icon),
      exact: m.module_key === "dashboard",
    }));
}

/** Mobile-first project chrome: dynamic nav, overflow sheet, per-project theme. */
export function ProjectShell({
  project,
  modules,
  subtitle,
  children,
}: {
  project: Project;
  modules: ProjectModule[];
  subtitle?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = projectNavItems(project.slug, modules);
  const primary = items.slice(0, 4);
  const overflow = items.slice(4);

  return (
    <ProjectTheme project={project} className="min-h-screen bg-background text-foreground">
      <div className="veil pointer-events-none fixed inset-x-0 top-0 h-72" />

      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          <button
            type="button"
            aria-label="Retour au hub"
            onClick={() => router.navigate({ to: "/hub" })}
            className="-ml-2 flex size-10 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
          >
            <ChevronLeft className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="brand-wordmark truncate text-sm text-foreground">{project.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {subtitle ?? project.subtitle ?? "Espace de travail"}
            </p>
          </div>
          <Link
            to={`/p/${project.slug}/reglages`}
            aria-label="Réglages du projet"
            className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground active:bg-muted"
          >
            <Settings2 className="size-[18px]" />
          </Link>
        </div>
        <div className="hairline h-px" />
      </header>

      <main className="relative mx-auto max-w-5xl px-4 pt-5 pb-32">{children}</main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 pt-1 backdrop-blur-xl">
        <ul className="mx-auto flex max-w-5xl items-stretch justify-between gap-1 px-2">
          {primary.map((item) => (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                activeOptions={{ exact: item.exact ?? false }}
                activeProps={{ "data-active": "true" }}
                className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium text-muted-foreground transition-colors data-[active=true]:bg-muted data-[active=true]:text-primary"
              >
                {item.icon}
                <span className="w-full truncate text-center leading-tight">{item.label}</span>
              </Link>
            </li>
          ))}
          {overflow.length ? (
            <li className="flex-1">
              <button
                type="button"
                onClick={() => setMoreOpen(true)}
                className="flex min-h-14 w-full flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium text-muted-foreground active:bg-muted"
              >
                <MoreHorizontal className="size-5" />
                <span>Plus</span>
              </button>
            </li>
          ) : null}
        </ul>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle>Modules du projet</SheetTitle>
          </SheetHeader>
          <ul className="grid grid-cols-3 gap-3 px-4 pb-8">
            {overflow.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className="surface-panel flex min-h-20 flex-col items-center justify-center gap-2 p-3 text-center text-[11px] font-medium active:opacity-90"
                >
                  <span className="text-primary">{item.icon}</span>
                  <span className="w-full truncate">{item.label}</span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                to={`/p/${project.slug}/reglages`}
                onClick={() => setMoreOpen(false)}
                className="surface-panel flex min-h-20 flex-col items-center justify-center gap-2 p-3 text-center text-[11px] font-medium text-muted-foreground active:opacity-90"
              >
                <Settings2 className="size-5" />
                <span>Réglages</span>
              </Link>
            </li>
          </ul>
        </SheetContent>
      </Sheet>
    </ProjectTheme>
  );
}
