import { createFileRoute } from "@tanstack/react-router";

import { CanvasList } from "@/components/aurixen/CanvasList";
import { LeoShell } from "@/components/aurixen/LeoShell";

export const Route = createFileRoute("/_authenticated/leo/canvas")({
  component: () => (
    <LeoShell subtitle="Espace de réflexion">
      <CanvasList projectSlug="leo-valen" />
    </LeoShell>
  ),
});
