import { createFileRoute, useParams } from "@tanstack/react-router";
import { RecordsSpace } from "@/components/aurixen/RecordsSpace";
import { useProjectCtx } from "@/components/aurixen/ProjectContext";
import { findModuleDef } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/p/$slug/m/$moduleKey")({ component: ModuleRecordsPage });

function ModuleRecordsPage() {
  const { slug, modules } = useProjectCtx();
  const { moduleKey } = useParams({ strict: false });
  const mod = modules.find((m) => m.module_key === moduleKey);
  const def = findModuleDef(moduleKey);
  return (
    <RecordsSpace
      projectSlug={slug}
      moduleKey={moduleKey}
      label={mod?.label ?? def?.label ?? moduleKey}
      fields={mod?.fields ?? def?.fields ?? []}
    />
  );
}
