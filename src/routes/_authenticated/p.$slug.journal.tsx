import { createFileRoute } from "@tanstack/react-router";

import { JournalSpace } from "@/components/aurixen/JournalSpace";

export const Route = createFileRoute("/_authenticated/p/$slug/journal")({
  component: () => <JournalSpace projectSlug={Route.useParams().slug} />,
});
