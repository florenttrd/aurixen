import { createFileRoute } from "@tanstack/react-router";

import { TasksSpace } from "@/components/aurixen/TasksSpace";

export const Route = createFileRoute("/_authenticated/p/$slug/taches")({
  component: () => <TasksSpace projectSlug={Route.useParams().slug} />,
});
