import { createFileRoute } from "@tanstack/react-router";
import { ProjectHome } from "@/components/aurixen/ProjectHome";
import { useProjectCtx } from "@/components/aurixen/ProjectContext";

export const Route = createFileRoute("/_authenticated/p/$slug/")({ component: ProjectHomePage });

function ProjectHomePage() {
  const { project, modules, slug } = useProjectCtx();
  return <ProjectHome project={project} modules={modules} slug={slug} />;
}
