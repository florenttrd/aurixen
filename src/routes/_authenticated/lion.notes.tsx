import { createFileRoute } from "@tanstack/react-router";

import { LionShell } from "@/components/aurixen/LionShell";
import { NotesSpace } from "@/components/aurixen/NotesSpace";

export const Route = createFileRoute("/_authenticated/lion/notes")({
  component: LionNotes,
});

function LionNotes() {
  return (
    <LionShell subtitle="Espace d'écriture">
      <NotesSpace projectSlug="danse-du-lion" title="Notes & organisation" />
    </LionShell>
  );
}
