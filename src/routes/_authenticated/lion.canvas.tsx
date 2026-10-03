import { createFileRoute } from "@tanstack/react-router";

import { CanvasList } from "@/components/aurixen/CanvasList";
import { LionShell } from "@/components/aurixen/LionShell";

export const Route = createFileRoute("/_authenticated/lion/canvas")({
  component: () => (
    <LionShell subtitle="Espace de réflexion">
      <CanvasList projectSlug="danse-du-lion" />
    </LionShell>
  ),
});
