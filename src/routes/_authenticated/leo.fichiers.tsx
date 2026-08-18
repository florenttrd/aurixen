import { createFileRoute } from "@tanstack/react-router";

import { FileManager } from "@/components/aurixen/FileManager";
import { LeoShell } from "@/components/aurixen/LeoShell";

export const Route = createFileRoute("/_authenticated/leo/fichiers")({
  component: LeoFiles,
});

function LeoFiles() {
  return (
    <LeoShell subtitle="Fichiers">
      <FileManager projectSlug="leo-valen" />
    </LeoShell>
  );
}
