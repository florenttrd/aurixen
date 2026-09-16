import { createFileRoute, Outlet, useParams, useNavigate } from "@tanstack/react-router";
import { ProjectShell } from "@/components/aurixen/ProjectShell";
import { ProjectCtx } from "@/components/aurixen/ProjectContext";
import { useProject, useProjectModules } from "@/hooks/useProjectSystem";

export const Route = createFileRoute("/_authenticated/p/$slug")({
  component: ProjectLayout,
});

function ProjectLayout() {
  const { slug } = useParams({ strict: false });
  const navigate = useNavigate();
  const projectQ = useProject(slug);
  const modulesQ = useProjectModules(slug);

  if (projectQ.isLoading || modulesQ.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }
  if (!projectQ.data) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center">
        <div>
          <p className="text-lg font-semibold">Projet introuvable</p>
          <button onClick={() => navigate({ to: "/hub" })} className="mt-3 text-sm text-primary underline">
            Retour au hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProjectCtx.Provider value={{ project: projectQ.data, modules: modulesQ.data ?? [], slug }}>
      <ProjectShell project={projectQ.data} modules={modulesQ.data ?? []} subtitle={projectQ.data.subtitle ?? "Espace de travail"}>
        <Outlet />
      </ProjectShell>
    </ProjectCtx.Provider>
  );
}
