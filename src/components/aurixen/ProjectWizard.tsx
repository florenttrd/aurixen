import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { DEFAULT_DESIGN, DesignFields, type DesignValue } from "./DesignFields";
import { ModuleIcon } from "./module-icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateProject } from "@/hooks/useProjectSystem";
import { DEFAULT_MODULE_KEYS, MODULE_CATALOG, SPECIALISED_MODULES, UNIVERSAL_MODULES } from "@/lib/modules";

const STEPS = ["Identité", "Modules", "Design"] as const;

export function ProjectWizard({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const create = useCreateProject();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [modules, setModules] = useState<string[]>(DEFAULT_MODULE_KEYS);
  const [design, setDesign] = useState<DesignValue>(DEFAULT_DESIGN);

  const allKeys = MODULE_CATALOG.map((m) => m.key);
  const toggle = (k: string) =>
    setModules((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));

  function reset() {
    setStep(0);
    setName("");
    setSubtitle("");
    setModules(DEFAULT_MODULE_KEYS);
    setDesign(DEFAULT_DESIGN);
  }

  async function finish() {
    const slug = await create.mutateAsync({
      name: name.trim(),
      subtitle: subtitle.trim() || undefined,
      modules: modules.includes("dashboard") ? modules : ["dashboard", ...modules],
      ...design,
    });
    onOpenChange(false);
    reset();
    if (typeof slug === "string") navigate({ to: "/p/$slug", params: { slug } });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <DialogHeader className="text-left">
          <p className="text-[10px] uppercase tracking-[0.22em] text-primary">
            Étape {step + 1} / {STEPS.length} · {STEPS[step]}
          </p>
          <DialogTitle>Nouveau projet</DialogTitle>
        </DialogHeader>

        <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
          {step === 0 ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pname">Nom du projet</Label>
                <Input id="pname" className="h-12" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="psub">Sous-titre (optionnel)</Label>
                <Input id="psub" className="h-12" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
              </div>
            </div>
          ) : step === 1 ? (
            <div className="space-y-4">
              <Button
                variant="outline"
                className="h-11 w-full rounded-xl"
                onClick={() => setModules(modules.length === allKeys.length ? DEFAULT_MODULE_KEYS : allKeys)}
              >
                {modules.length === allKeys.length ? "Revenir à la sélection par défaut" : "Tout activer"}
              </Button>
              {[
                { title: "Modules universels", list: UNIVERSAL_MODULES },
                { title: "Modules spécialisés", list: SPECIALISED_MODULES },
              ].map((group) => (
                <div key={group.title}>
                  <p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{group.title}</p>
                  <ul className="space-y-2">
                    {group.list.map((m) => (
                      <li key={m.key}>
                        <label className="surface-panel flex min-h-14 items-center gap-3 p-3">
                          <Checkbox
                            checked={m.key === "dashboard" || modules.includes(m.key)}
                            disabled={m.key === "dashboard"}
                            onCheckedChange={() => toggle(m.key)}
                            className="size-5"
                          />
                          <ModuleIcon name={m.icon} className="size-4 text-primary" />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">{m.label}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">{m.description}</span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Vous pourrez ajouter, retirer ou créer vos propres modules plus tard dans les réglages du projet.
              </p>
            </div>
          ) : (
            <DesignFields value={design} onChange={setDesign} />
          )}
        </div>

        <DialogFooter className="shrink-0 flex-row gap-2">
          {step > 0 ? (
            <Button variant="outline" className="h-12 flex-1 rounded-xl" onClick={() => setStep(step - 1)}>
              Retour
            </Button>
          ) : null}
          {step < STEPS.length - 1 ? (
            <Button className="h-12 flex-1 rounded-xl" disabled={!name.trim()} onClick={() => setStep(step + 1)}>
              Continuer
            </Button>
          ) : (
            <Button className="h-12 flex-1 rounded-xl" disabled={create.isPending} onClick={finish}>
              {create.isPending ? "Création…" : "Créer le projet"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
