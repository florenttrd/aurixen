import { createFileRoute } from "@tanstack/react-router";

import { CalendarBoard } from "@/components/aurixen/CalendarBoard";
import { LeoShell } from "@/components/aurixen/LeoShell";

export const Route = createFileRoute("/_authenticated/leo/calendrier")({
  component: LeoCalendar,
});

function LeoCalendar() {
  return (
    <LeoShell subtitle="Calendrier">
      <CalendarBoard
        projectSlug="leo-valen"
        overline="Planification"
        title="Calendrier Léo Valen"
      />
    </LeoShell>
  );
}
