import type { CSSProperties, ReactNode } from "react";

import { FONT_BODY_OPTIONS, FONT_DISPLAY_OPTIONS } from "@/lib/modules";
import type { Project } from "@/hooks/useProjectSystem";

type Surface = {
  background: string;
  foreground: string;
  card: string;
  surface: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
};

const SURFACE_TOKENS: Record<string, Surface> = {
  noir: {
    background: "#14100c",
    foreground: "#f6f1e6",
    card: "#1e1913",
    surface: "#221c15",
    muted: "#2a2318",
    mutedForeground: "#b8aa96",
    border: "#3a3123",
    input: "#3a3123",
  },
  encre: {
    background: "#0b0f1c",
    foreground: "#f2f5fb",
    card: "#141a2c",
    surface: "#182034",
    muted: "#1e2740",
    mutedForeground: "#a5b0c8",
    border: "#2b3550",
    input: "#2b3550",
  },
  ardoise: {
    background: "#131516",
    foreground: "#f1f3f4",
    card: "#1c2022",
    surface: "#202527",
    muted: "#262b2e",
    mutedForeground: "#a9b1b6",
    border: "#343a3e",
    input: "#343a3e",
  },
  clair: {
    background: "#f7f6f3",
    foreground: "#1a1712",
    card: "#ffffff",
    surface: "#f1efe9",
    muted: "#eae7e0",
    mutedForeground: "#635d54",
    border: "#d9d4ca",
    input: "#d9d4ca",
  },
};

const EFFECT_STRENGTH: Record<string, { veil: number; glow: number }> = {
  aucun: { veil: 0, glow: 0 },
  doux: { veil: 8, glow: 25 },
  moyen: { veil: 16, glow: 45 },
  intense: { veil: 28, glow: 70 },
};

function readableOn(hex: string) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#141110" : "#ffffff";
}

export function projectThemeStyle(project: Project): CSSProperties {
  const s = SURFACE_TOKENS[project.surface] ?? SURFACE_TOKENS["noir"]!;
  const fx = EFFECT_STRENGTH[project.effects] ?? EFFECT_STRENGTH["moyen"]!;
  const display =
    FONT_DISPLAY_OPTIONS.find((f) => f.key === project.font_display)?.stack ??
    FONT_DISPLAY_OPTIONS[0]!.stack;
  const body =
    FONT_BODY_OPTIONS.find((f) => f.key === project.font_body)?.stack ??
    FONT_BODY_OPTIONS[0]!.stack;

  return {
    "--background": s.background,
    "--foreground": s.foreground,
    "--card": s.card,
    "--card-foreground": s.foreground,
    "--popover": s.card,
    "--popover-foreground": s.foreground,
    "--surface": s.surface,
    "--surface-foreground": s.foreground,
    "--secondary": s.muted,
    "--secondary-foreground": s.foreground,
    "--muted": s.muted,
    "--muted-foreground": s.mutedForeground,
    "--accent": project.accent_secondary,
    "--accent-foreground": readableOn(project.accent_secondary),
    "--border": `color-mix(in oklab, ${s.border} 85%, transparent)`,
    "--input": `color-mix(in oklab, ${s.input} 85%, transparent)`,
    "--primary": project.accent,
    "--primary-foreground": readableOn(project.accent),
    "--ring": project.accent,
    "--chart-1": project.accent,
    "--chart-2": project.accent_secondary,
    "--radius": `${project.radius / 16}rem`,
    "--font-heading": display,
    "--font-body": body,
    "--gradient-brand": `linear-gradient(135deg, ${project.accent}, ${project.accent_secondary})`,
    "--gradient-veil": `radial-gradient(120% 80% at 50% 0%, color-mix(in oklab, ${project.accent} ${fx.veil}%, transparent), transparent 70%)`,
    "--shadow-glow": `0 0 48px -14px color-mix(in oklab, ${project.accent} ${fx.glow}%, transparent)`,
  } as CSSProperties;
}

export function ProjectTheme({
  project,
  children,
  className,
}: {
  project: Project;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className} style={projectThemeStyle(project)}>
      {children}
    </div>
  );
}
