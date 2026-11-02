import { createFileRoute } from "@tanstack/react-router";

import { LeoShell } from "@/components/aurixen/LeoShell";
import { ProjectConnectors } from "@/components/aurixen/ProjectConnectors";

export const Route = createFileRoute("/_authenticated/leo/connecteurs")({
  head: () => ({ meta: [{ title: "Connecteurs — Léo Valen" }] }),
  component: () => (
    <LeoShell subtitle="Connecteurs">
      <ProjectConnectors projectSlug="leo-valen" />
    </LeoShell>
  ),
});
