import { createFileRoute } from "@tanstack/react-router";

import { CanvasList } from "@/components/aurixen/CanvasList";
import { Shell } from "@/components/aurixen/Shell";
import { HUB_NAV } from "@/components/aurixen/navs";

export const Route = createFileRoute("/_authenticated/canvas/")({
  head: () => ({
    meta: [
      { title: "Canvas — AURIXEN" },
      { name: "description", content: "Espace de réflexion visuelle infini d'AURIXEN." },
    ],
  }),
  component: () => (
    <Shell wordmark="Aurixen" subtitle="Espace de réflexion" nav={HUB_NAV}>
      <CanvasList projectSlug="aurixen" />
    </Shell>
  ),
});
