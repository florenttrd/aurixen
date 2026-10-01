import { createFileRoute } from "@tanstack/react-router";

import { RecordsSpace } from "@/components/aurixen/RecordsSpace";
import { useProjectModules } from "@/hooks/useProjectSystem";
import { findModuleDef } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/p/$slug/m/$moduleKey")({
  component: ModulePage,
});

function ModulePage() {
  const { slug, moduleKey } = Route.useParams();
  const { data: modules = [], isLoading } = useProjectModules(slug);
  const mod = modules.find((m) => m.module_key === moduleKey);
  const def = findModuleDef(moduleKey);

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (!mod && !def) return <p className="text-sm text-muted-foreground">Module introuvable.</p>;

  const fields = mod?.fields?.length ? mod.fields : (def?.fields ?? []);
  return (
    <RecordsSpace
      projectSlug={slug}
      moduleKey={moduleKey}
      label={mod?.label ?? def?.label ?? moduleKey}
      fields={fields}
    />
  );
}
