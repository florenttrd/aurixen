import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { SectionTitle } from "./Shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useCreateCustomModule, usePurgeModuleData, useToggleModule, useUpdateProject, slugify,
} from "@/hooks/useProjectSystem";
import type { Project, ProjectModule } from "@/hooks/useProjectSystem";
import {
  ACCENT_PRESETS, EFFECTS_OPTIONS, FONT_BODY_OPTIONS, FONT_DISPLAY_OPTIONS, MODULE_CATALOG, SURFACES,
  type HomeBlock, type ModuleField,
} from "@/lib/modules";

type Tab = "modules" | "design" | "accueil";
const FIELD_TYPES: ModuleField["type"][] = ["texte", "nombre", "montant", "date", "email", "telephone", "long", "statut"];

export function ProjectSettings({ project, modules, slug }: { project: Project; modules: ProjectModule[]; slug: string }) {
  const [tab, setTab] = useState<Tab>("modules");
  return (
    <section>
      <SectionTitle overline="Configuration" title="Réglages du projet" />
      <div className="mb-4 flex gap-2">
        {((["modules", "design", "accueil"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            data-active={tab === t}
            className="h-10 rounded-full border border-border px-4 text-xs font-medium capitalize data-[active=true]:border-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "modules" ? <ModulesTab slug={slug} modules={modules} /> : null}
      {tab === "design" ? <DesignTab project={project} slug={slug} /> : null}
      {tab === "accueil" ? <HomeTab project={project} slug={slug} modules={modules} /> : null}
    </section>
  );
}

/* --------------------------------- modules -------------------------------- */
function ModulesTab({ slug, modules }: { slug: string; modules: ProjectModule[] }) {
  const toggle = useToggleModule(slug);
  const purge = usePurgeModuleData(slug);
  const createCustom = useCreateCustomModule(slug);
  const [cm, setCm] = useState<{ label: string; fields: { label: string; type: ModuleField["type"] }[] } | null>(null);
  const [purgeKey, setPurgeKey] = useState<string | null>(null);

  const enabled = new Set(modules.filter((m) => m.enabled).map((m) => m.module_key));

  function buildFields(): ModuleField[] {
    if (!cm) return [];
    return cm.fields.filter((f) => f.label.trim()).map((f) => ({ key: slugify(f.label) || `f${Math.random().toString(36).slice(2, 6)}`, label: f.label.trim(), type: f.type }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Activer / désactiver sans perdre les données.</p>
        <Button size="sm" variant="outline" className="h-9 rounded-full" onClick={() => MODULE_CATALOG.forEach((m) => !enabled.has(m.key) && toggle.mutate({ key: m.key, enabled: true }))}>
          Tout activer
        </Button>
      </div>

      <ul className="space-y-2">
        {MODULE_CATALOG.map((m) => {
          const on = enabled.has(m.key);
          return (
            <li key={m.key} className="surface-panel flex items-center gap-3 p-3">
              <Checkbox checked={on} onCheckedChange={(v) => toggle.mutate({ key: m.key, enabled: Boolean(v) })} className="size-6" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{m.label}</span>
                <span className="block truncate text-xs text-muted-foreground">{m.description}</span>
              </span>
              <button onClick={() => setPurgeKey(m.key)} aria-label="Supprimer les données" className="grid size-9 place-items-center rounded-full text-destructive active:bg-muted">
                <Trash2 className="size-4" />
              </button>
            </li>
          );
        })}
        {modules.filter((m) => m.kind === "custom").map((m) => (
          <li key={m.module_key} className="surface-panel flex items-center gap-3 p-3">
            <Checkbox checked={m.enabled} onCheckedChange={(v) => toggle.mutate({ key: m.module_key, enabled: Boolean(v) })} className="size-6" />
            <span className="flex-1 text-sm font-medium">{m.label ?? m.module_key} <span className="text-xs text-muted-foreground">· personnalisé</span></span>
            <button onClick={() => setPurgeKey(m.module_key)} className="grid size-9 place-items-center rounded-full text-destructive active:bg-muted"><Trash2 className="size-4" /></button>
          </li>
        ))}
      </ul>

      <Button className="h-12 w-full rounded-xl" onClick={() => setCm({ label: "", fields: [] })}>
        <Plus className="size-4" /> Ajouter un module personnalisé
      </Button>

      {/* custom builder */}
      <Dialog open={cm !== null} onOpenChange={(v) => !v && setCm(null)}>
        <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-y-auto">
          <DialogHeader className="text-left"><DialogTitle>Nouveau module</DialogTitle></DialogHeader>
          {cm ? (
            <div className="space-y-3">
              <Input className="h-12" placeholder="Nom du module (ex: Clients)" value={cm.label} onChange={(e) => setCm({ ...cm, label: e.target.value })} />
              <p className="text-xs text-muted-foreground">Champs</p>
              {cm.fields.map((f, i) => (
                <div key={i} className="flex gap-2">
                  <Input className="h-12" placeholder="Libellé du champ" value={f.label} onChange={(e) => setCm({ ...cm, fields: cm.fields.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
                  <Select value={f.type} onValueChange={(v) => setCm({ ...cm, fields: cm.fields.map((x, j) => j === i ? { ...x, type: v as ModuleField["type"] } : x) })}>
                    <SelectTrigger className="h-12 w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>{FIELD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <button onClick={() => setCm({ ...cm, fields: cm.fields.filter((_, j) => j !== i) })} className="grid size-12 place-items-center rounded-full text-destructive active:bg-muted"><X className="size-4" /></button>
                </div>
              ))}
              <Button variant="outline" className="h-10 w-full rounded-xl" onClick={() => setCm({ ...cm, fields: [...cm.fields, { label: "", type: "texte" }] })}><Plus className="size-4" /> Ajouter un champ</Button>
            </div>
          ) : null}
          <DialogFooter>
            <Button className="h-12 w-full rounded-xl" disabled={!cm?.label.trim()} onClick={() => { if (cm) { createCustom.mutate({ label: cm.label, fields: buildFields() }); setCm(null); } }}>Créer le module</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* purge confirm */}
      <Dialog open={purgeKey !== null} onOpenChange={(v) => !v && setPurgeKey(null)}>
        <DialogContent>
          <DialogHeader className="text-left"><DialogTitle>Supprimer les données ?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Cette action est définitive. Le module reste activé, seules ses données pour ce projet sont effacées.</p>
          <DialogFooter>
            <Button variant="outline" className="h-12 rounded-xl" onClick={() => setPurgeKey(null)}>Annuler</Button>
            <Button variant="destructive" className="h-12 rounded-xl" onClick={() => { if (purgeKey) { purge.mutate(purgeKey); setPurgeKey(null); } }}>Supprimer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------------------------- design -------------------------------- */
function DesignTab({ project, slug }: { project: Project; slug: string }) {
  const update = useUpdateProject(slug);
  const [d, setD] = useState({
    surface: project.surface, accent: project.accent, accent_secondary: project.accent_secondary,
    font_display: project.font_display, font_body: project.font_body, radius: project.radius, effects: project.effects,
  });
  useEffect(() => {
    setD({ surface: project.surface, accent: project.accent, accent_secondary: project.accent_secondary, font_display: project.font_display, font_body: project.font_body, radius: project.radius, effects: project.effects });
  }, [project]);

  function setField<K extends keyof typeof d>(k: K, v: (typeof d)[K]) { setD((p) => ({ ...p, [k]: v })); update.mutate({ [k]: v } as Partial<Project>); }

  return (
    <div className="space-y-5">
      <div>
        <Label className="mb-2 block">Fond</Label>
        <Select value={d.surface} onValueChange={(v) => setField("surface", v)}>
          <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
          <SelectContent>{SURFACES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-2 block">Couleur principale</Label>
        <div className="flex items-center gap-3">
          <input type="color" value={d.accent} onChange={(e) => setField("accent", e.target.value)} className="size-12 rounded-lg border border-border bg-transparent" />
          <div className="flex flex-wrap gap-2">{ACCENT_PRESETS.map((c) => <button key={c} onClick={() => setField("accent", c)} className="size-8 rounded-full border border-border" style={{ backgroundColor: c }} />)}</div>
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Couleur secondaire</Label>
        <div className="flex items-center gap-3">
          <input type="color" value={d.accent_secondary} onChange={(e) => setField("accent_secondary", e.target.value)} className="size-12 rounded-lg border border-border bg-transparent" />
          <div className="flex flex-wrap gap-2">{ACCENT_PRESETS.map((c) => <button key={c} onClick={() => setField("accent_secondary", c)} className="size-8 rounded-full border border-border" style={{ backgroundColor: c }} />)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-2 block">Police titres</Label>
          <Select value={d.font_display} onValueChange={(v) => setField("font_display", v)}>
            <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
            <SelectContent>{FONT_DISPLAY_OPTIONS.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block">Police texte</Label>
          <Select value={d.font_body} onValueChange={(v) => setField("font_body", v)}>
            <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
            <SelectContent>{FONT_BODY_OPTIONS.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Arrondis — {d.radius}px</Label>
        <input type="range" min={0} max={32} value={d.radius} onChange={(e) => setField("radius", Number(e.target.value))} className="w-full accent-primary" />
      </div>

      <div>
        <Label className="mb-2 block">Intensité des effets</Label>
        <Select value={d.effects} onValueChange={(v) => setField("effects", v)}>
          <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
          <SelectContent>{EFFECTS_OPTIONS.map((f) => <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );
}

/* --------------------------------- accueil -------------------------------- */
function HomeTab({ project, slug, modules }: { project: Project; slug: string; modules: ProjectModule[] }) {
  const update = useUpdateProject(slug);
  const [blocks, setBlocks] = useState<HomeBlock[]>(project.home_layout ?? []);
  useEffect(() => setBlocks(project.home_layout ?? []), [project.home_layout]);

  function commit(next: HomeBlock[]) { setBlocks(next); update.mutate({ home_layout: next }); }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks]; [next[i], next[j]] = [next[j], next[i]]; commit(next);
  }
  function remove(i: number) { commit(blocks.filter((_, j) => j !== i)); }
  function setSize(i: number, size: HomeBlock["size"]) { commit(blocks.map((b, j) => j === i ? { ...b, size } : b)); }
  function add(module: string) { commit([...blocks, { module, size: "moyen" }]); }

  const enabledKeys = modules.filter((m) => m.enabled).map((m) => m.module_key).filter((k) => k !== "dashboard" && k !== "recherche");
  const addOptions = enabledKeys.filter((k) => !blocks.some((b) => b.module === k));

  return (
    <div className="space-y-3">
      {blocks.length === 0 ? <p className="surface-panel p-5 text-sm text-muted-foreground">Aucun bloc. Ajoutez-en ci-dessous.</p> : null}
      {blocks.map((b, i) => (
        <div key={`${b.module}-${i}`} className="surface-panel flex items-center gap-2 p-3">
          <span className="flex-1 text-sm font-medium">{b.module}</span>
          <Select value={b.size} onValueChange={(v) => setSize(i, v as HomeBlock["size"])}>
            <SelectTrigger className="h-9 w-28 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="petit">petit</SelectItem>
              <SelectItem value="moyen">moyen</SelectItem>
              <SelectItem value="grand">grand</SelectItem>
            </SelectContent>
          </Select>
          <button onClick={() => move(i, -1)} className="grid size-9 place-items-center rounded-full text-muted-foreground active:bg-muted"><ArrowUp className="size-4" /></button>
          <button onClick={() => move(i, 1)} className="grid size-9 place-items-center rounded-full text-muted-foreground active:bg-muted"><ArrowDown className="size-4" /></button>
          <button onClick={() => remove(i)} className="grid size-9 place-items-center rounded-full text-destructive active:bg-muted"><Trash2 className="size-4" /></button>
        </div>
      ))}

      {addOptions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {addOptions.map((k) => (
            <button key={k} onClick={() => add(k)} className="flex h-10 items-center gap-1 rounded-full border border-dashed border-border px-4 text-xs text-muted-foreground active:bg-muted">
              <Plus className="size-3.5" /> {k}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
