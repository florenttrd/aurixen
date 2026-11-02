import { createFileRoute } from "@tanstack/react-router";

import { LionShell } from "@/components/aurixen/LionShell";
import { ProjectConnectors } from "@/components/aurixen/ProjectConnectors";

export const Route = createFileRoute("/_authenticated/lion/connecteurs")({
  head: () => ({ meta: [{ title: "Connecteurs — Danse du Lion" }] }),
  component: () => (
    <LionShell subtitle="Connecteurs">
      <ProjectConnectors projectSlug="danse-du-lion" />
    </LionShell>
  ),
});
