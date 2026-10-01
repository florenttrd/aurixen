import { createFileRoute } from "@tanstack/react-router";

import { NotesSpace } from "@/components/aurixen/NotesSpace";

export const Route = createFileRoute("/_authenticated/p/$slug/notes")({
  component: () => <NotesSpace projectSlug={Route.useParams().slug} title="Notes" />,
});
