import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { DesignFields, type DesignValue } from "@/components/aurixen/DesignFields";
import { ModuleIcon } from "@/components/aurixen/module-icons";
import { SectionTitle } from "@/components/aurixen/Shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreateCustomModule,
  usePurgeModuleData,
  useProject,
  useProjectModules,
  useToggleModule,
  useUpdateProject,
  type Project,
  type ProjectModule,
} from "@/hooks/useProjectSystem";
import { HOME_BLOCK_LABELS, MODULE_CATALOG, type HomeBlock, type ModuleField } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/p/$slug/reglages")({
  component: ProjectSettings,
});

function ProjectSettings() {
  const { slug } = Route.useParams();
  const { data: project } = useProject(slug);
  const { data: modules = [] } = useProjectModules(slug);
  if (!project) return null;
  return (
    <section>
      <SectionTitle overline={project.name} title="Réglages du projet" />
      <Tabs defaultValue="modules">
        <TabsList className="mb-4 grid h-11 w-full grid-cols-4">
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="accueil">Accueil</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="projet">Projet</TabsTrigger>
        </TabsList>
        <TabsContent value="modules">
          <ModulesTab slug={slug} modules={modules} />
        </TabsContent>
        <TabsContent value="accueil">
          <HomeTab project={project} modules={modules} />
        </TabsContent>
        <TabsContent value="design">
          <DesignTab project={project} />
        </TabsContent>
        <TabsContent value="projet">
          <IdentityTab project={project} />
        </TabsContent>
      </Tabs>
    </section>
  );
}

/* -------------------------------- modules ------------------------------- */

function ModulesTab({ slug, modules }: { slug: string; modules: ProjectModule[] }) {
  const toggle = useToggleModule(slug);
  const [purge, setPurge] = useState<{ key: string; label: string } | null>(null);
  const [builder, setBuilder] = useState(false);

  const customs = modules.filter((m) => m.kind === "custom");
  const rows = [
    ...MODULE_CATALOG.map((d) => ({ key: d.key, label: d.label, icon: d.icon, description: d.description })),
    ...customs.map((m) => ({ key: m.module_key, label: m.label ?? m.module_key, icon: m.icon ?? "box", description: "Module personnalisé" })),
  ];

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const enabled = row.key === "dashboard" || Boolean(modules.find((m) => m.module_key === row.key)?.enabled);
        return (
          <div key={row.key} className="surface-panel flex min-h-14 items-center gap-3 p-3">
            <ModuleIcon name={row.icon} className="size-4 text-primary" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{row.label}</span>
              <span className="block truncate text-[11px] text-muted-foreground">{row.description}</span>
            </span>
            {row.key !== "dashboard" && row.key !== "recherche" ? (
              <button
                type="button"
                aria-label={`Supprimer les données de ${row.label}`}
                onClick={() => setPurge({ key: row.key, label: row.label })}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
            <Switch
              checked={enabled}
              disabled={row.key === "dashboard"}
              onCheckedChange={(v) => toggle.mutate({ key: row.key, enabled: v })}
              aria-label={`Activer ${row.label}`}
            />
          </div>
        );
      })}
      <p className="px-1 pt-1 text-xs text-muted-foreground">
        Désactiver un module le retire seulement de la navigation : ses données sont conservées.
      </p>
      <Button className="mt-2 h-12 w-full rounded-xl" onClick={() => setBuilder(true)}>
        <Plus className="size-4" /> Ajouter un module
      </Button>

      <CustomModuleDialog slug={slug} open={builder} onOpenChange={setBuilder} />
      <PurgeDialog slug={slug} target={purge} onClose={() => setPurge(null)} />
    </div>
  );
}

const FIELD_TYPES: { key: ModuleField["type"]; label: string }[] = [
  { key: "texte", label: "Texte" },
  { key: "long", label: "Texte long" },
  { key: "nombre", label: "Nombre" },
  { key: "montant", label: "Montant" },
  { key: "date", label: "Date" },
  { key: "email", label: "E-mail" },
  { key: "telephone", label: "Téléphone" },
  { key: "statut", label: "Statut" },
];

function CustomModuleDialog({ slug, open, onOpenChange }: { slug: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const create = useCreateCustomModule(slug);
  const [label, setLabel] = useState("");
  const [fields, setFields] = useState<{ label: string; type: ModuleField["type"] }[]>([
    { label: "Téléphone", type: "telephone" },
    { label: "Email", type: "email" },
    { label: "Statut", type: "statut" },
    { label: "Notes", type: "long" },
  ]);

  async function submit() {
    const used = new Set<string>();
    const clean: ModuleField[] = fields
      .filter((f) => f.label.trim())
      .map((f, i) => {
        let key = f.label.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_") || `champ_${i}`;
        if (used.has(key)) key = `${key}_${i}`;
        used.add(key);
        return { key, label: f.label.trim(), type: f.type };
      });
    await create.mutateAsync({ label, fields: clean });
    setLabel("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <DialogHeader className="text-left">
          <DialogTitle>Créer un module</DialogTitle>
          <DialogDescription>Ex. « Clients » ou « Prospects », avec vos propres champs. Chaque fiche a déjà un nom.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          <Input className="h-12" placeholder="Nom du module" value={label} onChange={(e) => setLabel(e.target.value)} />
          <Label>Champs</Label>
          {fields.map((f, i) => (
            <div key={i} className="flex gap-2">
              <Input
                className="h-11 flex-1"
                placeholder="Nom du champ"
                value={f.label}
                onChange={(e) => setFields(fields.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
              />
              <select
                className="h-11 rounded-md border border-input bg-background px-2 text-sm"
                value={f.type}
                onChange={(e) =>
                  setFields(fields.map((x, j) => (j === i ? { ...x, type: e.target.value as ModuleField["type"] } : x)))
                }
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
              <button
                type="button"
                aria-label="Retirer le champ"
                onClick={() => setFields(fields.filter((_, j) => j !== i))}
                className="flex size-11 items-center justify-center text-muted-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" className="h-11 w-full rounded-xl" onClick={() => setFields([...fields, { label: "", type: "texte" }])}>
            <Plus className="size-4" /> Ajouter un champ
          </Button>
        </div>
        <DialogFooter className="shrink-0">
          <Button className="h-12 w-full rounded-xl" disabled={!label.trim() || create.isPending} onClick={submit}>
            Créer le module
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PurgeDialog({ slug, target, onClose }: { slug: string; target: { key: string; label: string } | null; onClose: () => void }) {
  const purge = usePurgeModuleData(slug);
  const [typed, setTyped] = useState("");
  useEffect(() => setTyped(""), [target]);
  return (
    <Dialog open={target !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader className="text-left">
          <DialogTitle>Supprimer définitivement les données</DialogTitle>
          <DialogDescription>
            Toutes les données « {target?.label} » de ce projet seront effacées. Cette action est irréversible.
            Recopiez <strong>SUPPRIMER</strong> pour confirmer.
          </DialogDescription>
        </DialogHeader>
        <Input className="h-12" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="SUPPRIMER" />
        <DialogFooter>
          <Button
            variant="destructive"
            className="h-12 w-full rounded-xl"
            disabled={typed !== "SUPPRIMER" || purge.isPending}
            onClick={async () => {
              if (!target) return;
              await purge.mutateAsync(target.key);
              onClose();
            }}
          >
            Effacer les données
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------------- home --------------------------------- */

const HOME_SIZES: { key: HomeBlock["size"]; label: string }[] = [
  { key: "petit", label: "Petit" },
  { key: "moyen", label: "Moyen" },
  { key: "grand", label: "Grand" },
];

function HomeTab({ project, modules }: { project: Project; modules: ProjectModule[] }) {
  const update = useUpdateProject(project.slug);
  const [blocks, setBlocks] = useState<HomeBlock[]>(project.home_layout);
  useEffect(() => setBlocks(project.home_layout), [project.home_layout]);

  const candidates = modules.filter(
    (m) => m.enabled && !["dashboard", "recherche"].includes(m.module_key) && !blocks.some((b) => b.module === m.module_key),
  );
  const label = (key: string) =>
    HOME_BLOCK_LABELS[key] ?? modules.find((m) => m.module_key === key)?.label ?? key;
  const move = (i: number, d: number) => {
    const next = [...blocks];
    const [b] = next.splice(i, 1);
    next.splice(i + d, 0, b!);
    setBlocks(next);
  };

  return (
    <div className="space-y-2">
      {blocks.length === 0 ? <p className="text-sm text-muted-foreground">Aucun bloc sur l'accueil.</p> : null}
      {blocks.map((b, i) => (
        <div key={b.module} className="surface-panel space-y-2 p-3">
          <div className="flex items-center gap-1">
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{label(b.module)}</span>
            <Button size="icon" variant="ghost" aria-label="Monter" disabled={i === 0} onClick={() => move(i, -1)}>
              <ArrowUp className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Descendre" disabled={i === blocks.length - 1} onClick={() => move(i, 1)}>
              <ArrowDown className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Retirer" onClick={() => setBlocks(blocks.filter((_, j) => j !== i))}>
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            {HOME_SIZES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setBlocks(blocks.map((x, j) => (j === i ? { ...x, size: s.key } : x)))}
                className={`min-h-9 flex-1 rounded-lg border text-xs ${b.size === s.key ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      {candidates.length ? (
        <div className="pt-2">
          <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Ajouter un bloc</p>
          <div className="flex flex-wrap gap-2">
            {candidates.map((m) => (
              <Button
                key={m.module_key}
                variant="outline"
                size="sm"
                className="h-10 rounded-xl"
                onClick={() => setBlocks([...blocks, { module: m.module_key, size: "moyen" }])}
              >
                <Plus className="size-3.5" /> {label(m.module_key)}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
      <Button className="mt-3 h-12 w-full rounded-xl" disabled={update.isPending} onClick={() => update.mutate({ home_layout: blocks })}>
        Enregistrer l'accueil
      </Button>
    </div>
  );
}

/* -------------------------------- design -------------------------------- */

function DesignTab({ project }: { project: Project }) {
  const update = useUpdateProject(project.slug);
  const [design, setDesign] = useState<DesignValue>({
    accent: project.accent,
    accent_secondary: project.accent_secondary,
    surface: project.surface,
    font_display: project.font_display,
    font_body: project.font_body,
    radius: project.radius,
    effects: project.effects,
    home_density: project.home_density,
  });
  return (
    <div>
      <DesignFields value={design} onChange={setDesign} />
      <Button className="mt-5 h-12 w-full rounded-xl" disabled={update.isPending} onClick={() => update.mutate(design)}>
        Appliquer le design
      </Button>
    </div>
  );
}

function IdentityTab({ project }: { project: Project }) {
  const update = useUpdateProject(project.slug);
  const [name, setName] = useState(project.name);
  const [subtitle, setSubtitle] = useState(project.subtitle ?? "");
  const [initials, setInitials] = useState(project.initials ?? "");
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nom</Label>
        <Input className="h-12" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Sous-titre</Label>
        <Input className="h-12" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Initiales (monogramme)</Label>
        <Input className="h-12" maxLength={3} value={initials} onChange={(e) => setInitials(e.target.value.toUpperCase())} />
      </div>
      <Button
        className="h-12 w-full rounded-xl"
        disabled={!name.trim() || update.isPending}
        onClick={() => update.mutate({ name: name.trim(), subtitle: subtitle.trim() || null, initials: initials.trim() || null })}
      >
        Enregistrer
      </Button>
      <p className="text-xs text-muted-foreground">
        La suppression d'un projet se fait depuis le hub, avec confirmation du nom et du mot de passe.
      </p>
    </div>
  );
}
