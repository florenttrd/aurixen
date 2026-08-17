import { createFileRoute } from "@tanstack/react-router";

import { CalendarBoard } from "@/components/aurixen/CalendarBoard";
import { Shell } from "@/components/aurixen/Shell";
import { HUB_NAV } from "@/components/aurixen/navs";

export const Route = createFileRoute("/_authenticated/calendrier")({
  component: GlobalCalendar,
});

function GlobalCalendar() {
  return (
    <Shell wordmark="Aurixen" subtitle="Calendrier global" nav={HUB_NAV}>
      <CalendarBoard
        title="Calendrier global"
        overline="Tous les projets"
        allowProjectChoice
      />
    </Shell>
  );
}
