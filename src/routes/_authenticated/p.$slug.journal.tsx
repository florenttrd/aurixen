import { createFileRoute } from "@tanstack/react-router";
import { JournalSpace } from "@/components/aurixen/JournalSpace";
import { useProjectCtx } from "@/components/aurixen/ProjectContext";

export const Route = createFileRoute("/_authenticated/p/$slug/journal")({ component: JournalPage });
function JournalPage() { const { slug } = useProjectCtx(); return <JournalSpace projectSlug={slug} title="Journal de bord" />; }
