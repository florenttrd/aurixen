import { createFileRoute } from "@tanstack/react-router";

import { NotesSpace } from "@/components/aurixen/NotesSpace";
import { Shell } from "@/components/aurixen/Shell";
import { HUB_NAV } from "@/components/aurixen/navs";

export const Route = createFileRoute("/_authenticated/notes")({
  component: HubNotes,
});

function HubNotes() {
  return (
    <Shell wordmark="Aurixen" subtitle="Espace d'écriture" nav={HUB_NAV}>
      <NotesSpace projectSlug="aurixen" title="Écriture Aurixen" />
    </Shell>
  );
}
