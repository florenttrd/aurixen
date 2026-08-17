import type { ReactNode } from "react";

import { Shell } from "./Shell";
import { LEO_NAV } from "./navs";

export function LeoShell({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  return (
    <Shell theme="theme-leo" wordmark="Léo Valen" subtitle={subtitle} backTo="/hub" nav={LEO_NAV}>
      {children}
    </Shell>
  );
}
