import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

import { ProjectShell } from "@/components/aurixen/ProjectShell";
import { useProject, useProjectModules } from "@/hooks/useProjectSystem";

export const Route = createFileRoute("/_authenticated/p/$slug")({
  head: () => ({
    meta: [
      { title: "Projet — AURIXEN" },
      { name: "description", content: "Espace de travail personnalisé AURIXEN." },
      { property: "og:title", content: "Projet — AURIXEN" },
      { property: "og:description", content: "Espace de travail personnalisé AURIXEN." },
    ],
  }),
  component: ProjectLayout,
});

function ProjectLayout() {
  const { slug } = Route.useParams();
  const { data: project, isLoading } = useProject(slug);
  const { data: modules = [] } = useProjectModules(slug);

  if (isLoading) {
    return <div className="min-h-screen bg-background p-6 text-sm text-muted-foreground">Chargement…</div>;
  }
  if (!project) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
        <p className="text-lg font-semibold">Projet introuvable</p>
        <Link to="/hub" className="text-primary underline underline-offset-4">
          Retour au hub
        </Link>
      </div>
    );
  }

  return (
    <ProjectShell project={project} modules={modules}>
      <Outlet />
    </ProjectShell>
  );
}
