import { createFileRoute } from "@tanstack/react-router";

import { LeoShell } from "@/components/aurixen/LeoShell";
import { NotesSpace } from "@/components/aurixen/NotesSpace";

export const Route = createFileRoute("/_authenticated/leo/notes")({
  component: LeoNotes,
});

function LeoNotes() {
  return (
    <LeoShell subtitle="Espace d'écriture">
      <NotesSpace projectSlug="leo-valen" title="Idées & stratégies" />
    </LeoShell>
  );
}
