import { createFileRoute } from "@tanstack/react-router";
import { FileManager } from "@/components/aurixen/FileManager";
import { useProjectCtx } from "@/components/aurixen/ProjectContext";

export const Route = createFileRoute("/_authenticated/p/$slug/fichiers")({ component: FichiersPage });
function FichiersPage() { const { slug } = useProjectCtx(); return <FileManager projectSlug={slug} />; }
