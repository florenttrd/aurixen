import { createFileRoute } from "@tanstack/react-router";
import { CircleDashed, CircleCheck, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { LeoShell } from "@/components/aurixen/LeoShell";
import { SectionTitle } from "@/components/aurixen/Shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useDeletePin, usePins, useSavePin, type Pin } from "@/hooks/useAurixen";
import { PRODUCTS, formatDate, withScores } from "@/lib/aurixen";

export const Route = createFileRoute("/_authenticated/leo/pins")({
  component: PinLibrary,
});

type Draft = Partial<Pin>;

function PinLibrary() {
  const { data: pins = [], isLoading } = usePins();
  const save = useSavePin();
  const remove = useDeletePin();

  const [filter, setFilter] = useState<"tous" | "cree" | "publie">("tous");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  const scored = useMemo(() => withScores(pins), [pins]);
  const visible = scored.filter((p) => (filter === "tous" ? true : p.status === filter));
  const current = scored.find((p) => p.id === detail);

  return (
    <LeoShell subtitle="Bibliothèque des pins">
      <SectionTitle
        overline="Pinterest"
        title="Bibliothèque"
        action={
          <Button
            size="sm"
            className="h-10 rounded-full"
            onClick={() => setDraft({ status: "cree", title: "" })}
          >
            <Plus className="size-4" /> Pin
          </Button>
        }
      />

      <div className="mb-4 flex gap-2">
        {(
          [
            { value: "tous", label: "Tous" },
            { value: "cree", label: "Créés" },
            { value: "publie", label: "Publiés" },
          ] as const
        ).map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            data-active={filter === f.value}
            className="h-10 flex-1 rounded-full border border-border text-xs font-medium text-muted-foreground data-[active=true]:border-primary data-[active=true]:bg-primary/15 data-[active=true]:text-primary"
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CircleDashed className="size-3.5 text-warning" /> Créé non publié
        </span>
        <span className="flex items-center gap-1.5">
          <CircleCheck className="size-3.5 text-success" /> Publié
        </span>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : visible.length === 0 ? (
        <div className="surface-panel p-6 text-center text-sm text-muted-foreground">
          Aucun pin. Ajoutez votre premier visuel.
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {visible.map((pin) => (
            <li key={pin.id}>
              <button
                type="button"
                onClick={() => setDetail(pin.id)}
                className="surface-panel w-full overflow-hidden p-0 text-left active:opacity-90"
              >
                <span className="relative block aspect-[2/3] w-full bg-muted">
                  {pin.image_url ? (
                    <img
                      src={pin.image_url}
                      alt={pin.title}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span className="flex size-full items-center justify-center text-xs text-muted-foreground">
                      Sans image
                    </span>
                  )}
                  <span
                    className="absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold"
                    style={{
                      backgroundColor:
                        pin.status === "publie"
                          ? "color-mix(in oklab, var(--success) 25%, transparent)"
                          : "color-mix(in oklab, var(--warning) 25%, transparent)",
                      color: pin.status === "publie" ? "var(--success)" : "var(--warning)",
                    }}
                  >
                    {pin.status === "publie" ? (
                      <CircleCheck className="size-3" />
                    ) : (
                      <CircleDashed className="size-3" />
                    )}
                    {pin.status === "publie" ? "Publié" : "Créé"}
                  </span>
                  <span className="absolute bottom-2 right-2 rounded-full bg-background/80 px-2 py-1 text-[10px] font-bold tabular-nums">
                    {pin.score}
                  </span>
                </span>
                <span className="block p-3">
                  <span className="block truncate text-sm font-medium">{pin.title}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {pin.product ?? "Sans produit"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Fiche détaillée */}
      <Dialog open={detail !== null} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="top-4 max-h-[88vh] translate-y-0 overflow-y-auto sm:top-1/2 sm:-translate-y-1/2">
          {current ? (
            <>
              <DialogHeader className="text-left">
                <DialogTitle>{current.title}</DialogTitle>
              </DialogHeader>
              {current.image_url ? (
                <img
                  src={current.image_url}
                  alt={current.title}
                  className="max-h-64 w-full rounded-xl object-cover"
                />
              ) : null}
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <Field label="Statut" value={current.status === "publie" ? "Publié" : "Créé"} />
                <Field label="Publication" value={formatDate(current.published_at)} />
                <Field label="Produit" value={current.product ?? "—"} />
                <Field label="Note / score" value={`${current.score} / 100`} />
                <Field label="Impressions" value={current.impressions.toLocaleString("fr-FR")} />
                <Field label="Enregistrements" value={current.saves.toLocaleString("fr-FR")} />
                <Field label="Clics" value={current.clicks.toLocaleString("fr-FR")} />
                <Field label="Clics sortants" value={current.outbound_clicks.toLocaleString("fr-FR")} />
              </dl>
              {current.description ? (
                <p className="text-sm text-muted-foreground">{current.description}</p>
              ) : null}
              {current.notes ? (
                <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">
                  {current.notes}
                </p>
              ) : null}
              <DialogFooter className="flex-row gap-2">
                <Button
                  className="h-12 flex-1 rounded-xl"
                  onClick={() => {
                    setDraft({ ...current });
                    setDetail(null);
                  }}
                >
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  aria-label="Supprimer le pin"
                  className="size-12 rounded-xl text-destructive"
                  onClick={() => {
                    remove.mutate(current.id);
                    setDetail(null);
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Formulaire */}
      <Dialog open={draft !== null} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogContent className="top-4 max-h-[88vh] translate-y-0 overflow-y-auto sm:top-1/2 sm:-translate-y-1/2">
          <DialogHeader className="text-left">
            <DialogTitle>{draft?.id ? "Modifier le pin" : "Nouveau pin"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-3">
              <Input
                className="h-12"
                placeholder="Titre du pin"
                value={draft.title ?? ""}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
              <Input
                className="h-12"
                placeholder="URL de l'image"
                value={draft.image_url ?? ""}
                onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
              />
              <div className="flex gap-2">
                <Select
                  value={draft.status ?? "cree"}
                  onValueChange={(v) => setDraft({ ...draft, status: v })}
                >
                  <SelectTrigger className="h-12 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cree">Créé (non publié)</SelectItem>
                    <SelectItem value="publie">Publié</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  className="h-12 flex-1"
                  value={draft.published_at ?? ""}
                  onChange={(e) => setDraft({ ...draft, published_at: e.target.value })}
                />
              </div>
              <Select
                value={draft.product ?? ""}
                onValueChange={(v) => setDraft({ ...draft, product: v })}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Produit associé" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCTS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label="Impressions"
                  value={draft.impressions ?? 0}
                  onChange={(v) => setDraft({ ...draft, impressions: v })}
                />
                <NumberField
                  label="Enregistrements"
                  value={draft.saves ?? 0}
                  onChange={(v) => setDraft({ ...draft, saves: v })}
                />
                <NumberField
                  label="Clics"
                  value={draft.clicks ?? 0}
                  onChange={(v) => setDraft({ ...draft, clicks: v })}
                />
                <NumberField
                  label="Clics sortants"
                  value={draft.outbound_clicks ?? 0}
                  onChange={(v) => setDraft({ ...draft, outbound_clicks: v })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Note manuelle (0-100, optionnel)
                </Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  className="h-12"
                  value={draft.manual_score ?? ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      manual_score: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>
              <Textarea
                rows={3}
                placeholder="Description"
                value={draft.description ?? ""}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
              <Textarea
                rows={3}
                placeholder="Observations / notes internes"
                value={draft.notes ?? ""}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button
              className="h-12 w-full rounded-xl"
              onClick={() => {
                if (!draft) return;
                save.mutate(draft, { onSuccess: () => setDraft(null) });
              }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LeoShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type="number"
        inputMode="numeric"
        className="h-12"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
