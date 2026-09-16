import { createFileRoute } from "@tanstack/react-router";
import { NotesSpace } from "@/components/aurixen/NotesSpace";
import { useProjectCtx } from "@/components/aurixen/ProjectContext";

export const Route = createFileRoute("/_authenticated/p/$slug/notes")({ component: NotesPage });
function NotesPage() { const { slug } = useProjectCtx(); return <NotesSpace projectSlug={slug} title="Idées & stratégies" />; }
