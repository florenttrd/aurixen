import { createFileRoute } from "@tanstack/react-router";
import { ProjectSettings } from "@/components/aurixen/ProjectSettings";
import { useProjectCtx } from "@/components/aurixen/ProjectContext";

export const Route = createFileRoute("/_authenticated/p/$slug/reglages")({ component: ReglagesPage });

function ReglagesPage() {
  const ctx = useProjectCtx();
  return <ProjectSettings {...ctx} />;
}
