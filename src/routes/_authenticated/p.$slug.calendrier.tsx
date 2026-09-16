import { createFileRoute } from "@tanstack/react-router";
import { CalendarBoard } from "@/components/aurixen/CalendarBoard";
import { useProjectCtx } from "@/components/aurixen/ProjectContext";

export const Route = createFileRoute("/_authenticated/p/$slug/calendrier")({ component: CalendrierPage });
function CalendrierPage() { const { slug } = useProjectCtx(); return <CalendarBoard projectSlug={slug} overline="Planification" title="Calendrier" />; }
