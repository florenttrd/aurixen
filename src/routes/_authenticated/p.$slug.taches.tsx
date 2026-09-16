import { createFileRoute } from "@tanstack/react-router";
import { TasksSpace } from "@/components/aurixen/TasksSpace";
import { useProjectCtx } from "@/components/aurixen/ProjectContext";

export const Route = createFileRoute("/_authenticated/p/$slug/taches")({ component: TachesPage });
function TachesPage() { const { slug } = useProjectCtx(); return <TasksSpace projectSlug={slug} />; }
