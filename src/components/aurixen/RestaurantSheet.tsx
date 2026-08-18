import { Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

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
import {
  useAvailabilities,
  useDeleteAvailability,
  useSaveAvailability,
  useSaveRestaurant,
  type CustomField,
  type Restaurant,
} from "@/hooks/useAurixen";
import { INTEREST_LEVELS, formatDate, toISODate } from "@/lib/aurixen";

const EMPTY: Partial<Restaurant> = { name: "", interest: "inconnu", custom_fields: [] };

export function RestaurantSheet({
  value,
  onClose,
}: {
  value: Restaurant | "new" | null;
  onClose: () => void;
}) {
  const save = useSaveRestaurant();
  const [draft, setDraft] = useState<Partial<Restaurant>>(EMPTY);

  useEffect(() => {
    if (value === "new") setDraft({ ...EMPTY });
    else if (value) setDraft({ ...value });
  }, [value]);

  const fields = draft.custom_fields ?? [];

  function setField(index: number, patch: Partial<CustomField>) {
    const next = fields.map((f, i) => (i === index ? { ...f, ...patch } : f));
    setDraft({ ...draft, custom_fields: next });
  }

  return (
    <Dialog open={value !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="top-4 max-h-[90vh] translate-y-0 overflow-y-auto sm:top-1/2 sm:-translate-y-1/2">
        <DialogHeader className="text-left">
          <DialogTitle>{value === "new" ? "Nouvelle fiche" : draft.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <TextField
            label="Nom du restaurant"
            value={draft.name ?? ""}
            onChange={(v) => setDraft({ ...draft, name: v })}
          />
          <TextField
            label="Emplacement"
            value={draft.location ?? ""}
            onChange={(v) => setDraft({ ...draft, location: v })}
          />
          <TextField
            label="Adresse"
            value={draft.address ?? ""}
            onChange={(v) => setDraft({ ...draft, address: v })}
          />
          <div className="grid grid-cols-2 gap-2">
            <TextField
              label="Téléphone"
              type="tel"
              value={draft.phone ?? ""}
              onChange={(v) => setDraft({ ...draft, phone: v })}
            />
            <TextField
              label="Email"
              type="email"
              value={draft.email ?? ""}
              onChange={(v) => setDraft({ ...draft, email: v })}
            />
          </div>
          <TextField
            label="Site web"
            value={draft.website ?? ""}
            onChange={(v) => setDraft({ ...draft, website: v })}
          />
          <div className="grid grid-cols-2 gap-2">
            <TextField
              label="Style de cuisine"
              value={draft.cuisine ?? ""}
              onChange={(v) => setDraft({ ...draft, cuisine: v })}
            />
            <TextField
              label="Taille"
              value={draft.size ?? ""}
              onChange={(v) => setDraft({ ...draft, size: v })}
            />
          </div>
          <TextField
            label="Parking à proximité"
            value={draft.parking ?? ""}
            onChange={(v) => setDraft({ ...draft, parking: v })}
          />
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Intérêt pour la prestation</Label>
            <Select
              value={draft.interest ?? "inconnu"}
              onValueChange={(v) => setDraft({ ...draft, interest: v })}
            >
              <SelectTrigger className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTEREST_LEVELS.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes personnelles</Label>
            <Textarea
              rows={4}
              value={draft.notes ?? ""}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Informations personnalisées</Label>
              <button
                type="button"
                onClick={() =>
                  setDraft({ ...draft, custom_fields: [...fields, { label: "", value: "" }] })
                }
                className="flex items-center gap-1 text-xs text-primary"
              >
                <Plus className="size-3.5" /> Ajouter
              </button>
            </div>
            {fields.map((f, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  className="h-11 flex-1"
                  placeholder="Libellé"
                  value={f.label}
                  onChange={(e) => setField(i, { label: e.target.value })}
                />
                <Input
                  className="h-11 flex-1"
                  placeholder="Valeur"
                  value={f.value}
                  onChange={(e) => setField(i, { value: e.target.value })}
                />
                <button
                  type="button"
                  aria-label="Retirer le champ"
                  onClick={() =>
                    setDraft({ ...draft, custom_fields: fields.filter((_, j) => j !== i) })
                  }
                  className="grid size-11 shrink-0 place-items-center rounded-lg text-muted-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {value !== "new" && value ? <Availabilities restaurantId={value.id} /> : null}

        <DialogFooter>
          <Button
            className="h-12 w-full rounded-xl"
            onClick={() => save.mutate(draft, { onSuccess: () => onClose() })}
          >
            Enregistrer la fiche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Availabilities({ restaurantId }: { restaurantId: string }) {
  const { data: slots = [] } = useAvailabilities(restaurantId);
  const save = useSaveAvailability();
  const remove = useDeleteAvailability();
  const [date, setDate] = useState(toISODate(new Date()));
  const [time, setTime] = useState("");
  const [status, setStatus] = useState("disponible");

  return (
    <section className="mt-2 rounded-2xl border border-border p-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        Disponibilités danse du lion
      </p>

      <div className="mt-3 flex gap-2">
        <Input
          type="date"
          className="h-11 flex-1"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Input
          type="time"
          className="h-11 w-28"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
      </div>
      <div className="mt-2 flex gap-2">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-11 flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="disponible">Disponible</SelectItem>
            <SelectItem value="reserve">Réservé</SelectItem>
            <SelectItem value="indisponible">Indisponible</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          className="h-11 rounded-xl"
          onClick={() =>
            save.mutate({
              restaurant_id: restaurantId,
              slot_date: date,
              slot_time: time || null,
              status,
            })
          }
        >
          <Plus className="size-4" /> Ajouter
        </Button>
      </div>

      {slots.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {slots.map((s) => (
            <li key={s.id} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2">
              <span className="min-w-0 flex-1 text-xs">
                {formatDate(s.slot_date)}
                {s.slot_time ? ` · ${s.slot_time.slice(0, 5)}` : ""} — {s.status}
              </span>
              <button
                type="button"
                aria-label="Supprimer la disponibilité"
                onClick={() => remove.mutate(s.id)}
                className="grid size-8 place-items-center rounded-lg text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type={type} className="h-12" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
