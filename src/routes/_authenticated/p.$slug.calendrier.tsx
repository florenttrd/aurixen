import { createFileRoute } from "@tanstack/react-router";

import { CalendarBoard } from "@/components/aurixen/CalendarBoard";

export const Route = createFileRoute("/_authenticated/p/$slug/calendrier")({
  component: () => (
    <CalendarBoard projectSlug={Route.useParams().slug} overline="Planification" title="Calendrier" />
  ),
});
