import { Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, LogOut, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { GlobalSearch } from "./GlobalSearch";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export type NavItem = { to: string; label: string; icon: ReactNode; exact?: boolean };

type Props = {
  theme?: string;
  wordmark: string;
  subtitle?: string;
  backTo?: string;
  nav?: NavItem[];
  children: ReactNode;
};

export function Shell({ theme, wordmark, subtitle, backTo, nav, children }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth" });
  }

  return (
    <div className={cn(theme, "min-h-screen bg-background text-foreground")}>
      <div className="veil pointer-events-none fixed inset-x-0 top-0 h-72" />

      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-4">
          {backTo ? (
            <Link
              to={backTo}
              aria-label="Retour"
              className="-ml-2 flex size-10 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
            >
              <ChevronLeft className="size-5" />
            </Link>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="brand-wordmark truncate text-sm text-foreground">{wordmark}</p>
            {subtitle ? (
              <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Recherche globale"
            className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground active:bg-muted"
          >
            <Search className="size-[18px]" />
          </button>
          <button
            type="button"
            onClick={signOut}
            aria-label="Se déconnecter"
            className="flex size-10 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
          >
            <LogOut className="size-[18px]" />
          </button>
        </div>
        <div className="hairline h-px" />
      </header>

      <main
        className={cn(
          "relative mx-auto max-w-5xl px-4 pt-5",
          nav?.length ? "pb-32" : "pb-16",
        )}
      >
        {children}
      </main>

      {nav?.length ? (
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border/70 bg-background/90 pt-1 backdrop-blur-xl">
          <ul className="mx-auto flex max-w-5xl items-stretch justify-between gap-1 px-2">
            {nav.map((item) => (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.exact ?? false }}
                  activeProps={{ "data-active": "true" }}
                  className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium text-muted-foreground transition-colors data-[active=true]:bg-muted data-[active=true]:text-primary"
                >
                  {item.icon}
                  <span className="w-full truncate text-center leading-tight">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

export function SectionTitle({
  overline,
  title,
  action,
}: {
  overline?: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        {overline ? (
          <p className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">{overline}</p>
        ) : null}
        <h2 className="text-2xl font-semibold leading-tight">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="surface-panel p-4">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
