import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Shell } from "@/components/aurixen/Shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCreateProject } from "@/hooks/useProjectSystem";
import {
  ACCENT_PRESETS, DEFAULT_MODULE_KEYS, EFFECTS_OPTIONS, FONT_BODY_OPTIONS,
  FONT_DISPLAY_OPTIONS, MODULE_CATALOG, SURFACES,
} from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/nouveau-projet")({ component: NewProjectPage });

function NewProjectPage() {
  const navigate = useNavigate();
  const create = useCreateProject();
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [keys, setKeys] = useState<string[]>(DEFAULT_MODULE_KEYS);
  const [accent, setAccent] = useState(ACCENT_PRESETS[1] ?? "#3d8bff");
  const [accent2, setAccent2] = useState(ACCENT_PRESETS[4] ?? "#a855f7");
  const [surface, setSurface] = useState("encre");
  const [fd, setFd] = useState("sans-tech");
  const [fb, setFb] = useState("sans-moderne");
  const [radius, setRadius] = useState(16);
  const [effects, setEffects] = useState("moyen");

  function toggleKey(k: string) { setKeys((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k])); }

  async function submit() {
    if (!name.trim()) return;
    const slug = await create.mutateAsync({
      name, subtitle, modules: keys, accent, accent_secondary: accent2,
      surface, font_display: fd, font_body: fb, radius, effects, home_density: "cartes",
    });
    navigate({ to: `/p/${slug}` });
  }

  return (
    <Shell wordmark="AURIXEN" subtitle="Nouveau projet" backTo="/hub">
      <div className="space-y-8">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Nouveau projet</p>
          <h1 className="mt-2 text-3xl font-semibold">Créer un espace de travail</h1>
        </div>

        <div className="space-y-3">
          <Label>Nom du projet</Label>
          <Input className="h-12" placeholder="Ex: Studio photo" value={name} onChange={(e) => setName(e.target.value)} />
          <Input className="h-12" placeholder="Sous-titre (optionnel)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Modules</Label>
            <Button size="sm" variant="outline" className="h-9 rounded-full" onClick={() => setKeys(MODULE_CATALOG.map((m) => m.key))}>Tout activer</Button>
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {MODULE_CATALOG.map((m) => (
              <li key={m.key} className="surface-panel flex items-center gap-3 p-3">
                <Checkbox checked={keys.includes(m.key)} onCheckedChange={() => toggleKey(m.key)} className="size-6" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{m.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">{m.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <Label>Design</Label>
          <div className="grid grid-cols-2 gap-3">
            <SelectField label="Fond" value={surface} onChange={setSurface} options={SURFACES.map((s) => ({ value: s.key, label: s.label }))} />
            <SelectField label="Effets" value={effects} onChange={setEffects} options={EFFECTS_OPTIONS.map((s) => ({ value: s.key, label: s.label }))} />
            <SelectField label="Police titres" value={fd} onChange={setFd} options={FONT_DISPLAY_OPTIONS.map((s) => ({ value: s.key, label: s.label }))} />
            <SelectField label="Police texte" value={fb} onChange={setFb} options={FONT_BODY_OPTIONS.map((s) => ({ value: s.key, label: s.label }))} />
          </div>
          <div className="flex items-center gap-4">
            <Label className="shrink-0">Principale</Label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="size-12 rounded-lg border border-border bg-transparent" />
            <Label className="shrink-0">Secondaire</Label>
            <input type="color" value={accent2} onChange={(e) => setAccent2(e.target.value)} className="size-12 rounded-lg border border-border bg-transparent" />
          </div>
          <div>
            <Label className="mb-2 block">Arrondis — {radius}px</Label>
            <input type="range" min={0} max={32} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className="w-full accent-primary" />
          </div>
        </div>

        <Button className="h-12 w-full rounded-xl" disabled={!name.trim() || create.isPending} onClick={submit}>
          {create.isPending ? "Création…" : "Créer le projet"}
        </Button>
      </div>
    </Shell>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <Label className="mb-2 block">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
        <SelectContent>{options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
