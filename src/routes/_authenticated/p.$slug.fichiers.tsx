import { createFileRoute } from "@tanstack/react-router";

import { FileManager } from "@/components/aurixen/FileManager";
import { SectionTitle } from "@/components/aurixen/Shell";

export const Route = createFileRoute("/_authenticated/p/$slug/fichiers")({
  component: () => (
    <section>
      <SectionTitle overline="Documents" title="Fichiers" />
      <FileManager projectSlug={Route.useParams().slug} />
    </section>
  ),
});
