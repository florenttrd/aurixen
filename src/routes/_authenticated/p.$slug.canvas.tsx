import { createFileRoute } from "@tanstack/react-router";

import { CanvasList } from "@/components/aurixen/CanvasList";

export const Route = createFileRoute("/_authenticated/p/$slug/canvas")({
  component: () => <CanvasList projectSlug={Route.useParams().slug} />,
});
