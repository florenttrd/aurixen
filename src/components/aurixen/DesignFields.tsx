import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  ACCENT_PRESETS,
  EFFECTS_OPTIONS,
  FONT_BODY_OPTIONS,
  FONT_DISPLAY_OPTIONS,
  SURFACES,
} from "@/lib/modules";
import { cn } from "@/lib/utils";

export type DesignValue = {
  accent: string;
  accent_secondary: string;
  surface: string;
  font_display: string;
  font_body: string;
  radius: number;
  effects: string;
  home_density: string;
};

export const DEFAULT_DESIGN: DesignValue = {
  accent: "#c9a84c",
  accent_secondary: "#f5e6b8",
  surface: "noir",
  font_display: "serif-luxe",
  font_body: "sans-moderne",
  radius: 16,
  effects: "moyen",
  home_density: "cartes",
};

function Chips<T extends string>({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { key: T; label: string; style?: React.CSSProperties }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          style={o.style}
          className={cn(
            "min-h-10 rounded-xl border border-border px-3 text-sm",
            value === o.key ? "border-primary bg-primary/15 text-primary" : "text-muted-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-center gap-2">
        {ACCENT_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Couleur ${c}`}
            onClick={() => onChange(c)}
            style={{ backgroundColor: c }}
            className={cn(
              "size-9 rounded-full border-2",
              value.toLowerCase() === c ? "border-foreground" : "border-transparent",
            )}
          />
        ))}
        <input
          type="color"
          aria-label={`${label} personnalisée`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 cursor-pointer rounded-full border border-border bg-transparent"
        />
      </div>
    </div>
  );
}

export function DesignFields({ value, onChange }: { value: DesignValue; onChange: (v: DesignValue) => void }) {
  const set = <K extends keyof DesignValue>(k: K, v: DesignValue[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-5">
      <ColorRow label="Couleur principale" value={value.accent} onChange={(v) => set("accent", v)} />
      <ColorRow label="Couleur secondaire" value={value.accent_secondary} onChange={(v) => set("accent_secondary", v)} />
      <div className="space-y-2">
        <Label>Fond</Label>
        <Chips value={value.surface} options={SURFACES} onChange={(v) => set("surface", v)} />
      </div>
      <div className="space-y-2">
        <Label>Police des titres</Label>
        <Chips
          value={value.font_display}
          options={FONT_DISPLAY_OPTIONS.map((f) => ({ ...f, style: { fontFamily: f.stack } }))}
          onChange={(v) => set("font_display", v)}
        />
      </div>
      <div className="space-y-2">
        <Label>Police du texte</Label>
        <Chips
          value={value.font_body}
          options={FONT_BODY_OPTIONS.map((f) => ({ ...f, style: { fontFamily: f.stack } }))}
          onChange={(v) => set("font_body", v)}
        />
      </div>
      <div className="space-y-3">
        <Label>Arrondis · {value.radius}px</Label>
        <Slider min={0} max={28} step={2} value={[value.radius]} onValueChange={([v]) => set("radius", v ?? 16)} />
      </div>
      <div className="space-y-2">
        <Label>Intensité des effets</Label>
        <Chips value={value.effects} options={EFFECTS_OPTIONS} onChange={(v) => set("effects", v)} />
      </div>
      <div className="space-y-2">
        <Label>Disposition de l'accueil</Label>
        <Chips
          value={value.home_density}
          options={[
            { key: "cartes", label: "Grille de cartes" },
            { key: "liste", label: "Liste pleine largeur" },
          ]}
          onChange={(v) => set("home_density", v)}
        />
      </div>
    </div>
  );
}
