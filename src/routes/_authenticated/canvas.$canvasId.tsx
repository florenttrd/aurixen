import { createFileRoute } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

const CanvasEditor = lazy(() => import("@/components/aurixen/CanvasEditor"));

export const Route = createFileRoute("/_authenticated/canvas/$canvasId")({
  head: () => ({
    meta: [
      { title: "Canvas — AURIXEN" },
      { name: "description", content: "Espace de réflexion visuelle infini." },
      { property: "og:title", content: "Canvas — AURIXEN" },
      { property: "og:description", content: "Espace de réflexion visuelle infini." },
    ],
  }),
  component: CanvasPage,
});

function CanvasPage() {
  const { canvasId } = Route.useParams();
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-background text-sm text-muted-foreground">
          Ouverture du canvas…
        </div>
      }
    >
      <CanvasEditor canvasId={canvasId} />
    </Suspense>
  );
}
