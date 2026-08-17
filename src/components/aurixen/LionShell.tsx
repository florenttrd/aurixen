import type { ReactNode } from "react";

import { Shell } from "./Shell";
import { LION_NAV } from "./navs";

export function LionShell({ subtitle, children }: { subtitle: string; children: ReactNode }) {
  return (
    <Shell
      theme="theme-lion"
      wordmark="舞獅 · Danse du Lion"
      subtitle={subtitle}
      backTo="/hub"
      nav={LION_NAV}
    >
      {children}
    </Shell>
  );
}
