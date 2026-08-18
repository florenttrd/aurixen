import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { LeoShell } from "@/components/aurixen/LeoShell";
import { SectionTitle, StatCard } from "@/components/aurixen/Shell";
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
import { useDeleteSale, useSales, useSaveSale } from "@/hooks/useAurixen";
import { PRODUCTS, formatMoney, startOfMonth, startOfWeek, toISODate } from "@/lib/aurixen";

export const Route = createFileRoute("/_authenticated/leo/ventes")({
  component: SalesPage,
});

function SalesPage() {
  const { data: sales = [] } = useSales();
  const save = useSaveSale();
  const remove = useDeleteSale();
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState(PRODUCTS[0]!);
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [soldAt, setSoldAt] = useState(toISODate(new Date()));

  const stats = useMemo(() => {
    const weekIso = startOfWeek().toISOString();
    const monthIso = startOfMonth().toISOString();
    const total = sales.reduce((s, x) => s + Number(x.amount), 0);
    const week = sales
      .filter((s) => s.sold_at >= weekIso)
      .reduce((s, x) => s + Number(x.amount), 0);
    const month = sales
      .filter((s) => s.sold_at >= monthIso)
      .reduce((s, x) => s + Number(x.amount), 0);
    return { total, week, month, count: sales.length };
  }, [sales]);

  const byProduct = useMemo(() => {
    const rows = PRODUCTS.map((p) => ({
      product: p,
      total: sales.filter((s) => s.product === p).reduce((sum, s) => sum + Number(s.amount), 0),
      count: sales.filter((s) => s.product === p).length,
    }));
    const max = Math.max(1, ...rows.map((r) => r.total));
    return { rows, max };
  }, [sales]);

  const daily = useMemo(() => {
    const days: { label: string; total: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = toISODate(d);
      days.push({
        label: String(d.getDate()),
        total: sales
          .filter((s) => s.sold_at.slice(0, 10) === iso)
          .reduce((sum, s) => sum + Number(s.amount), 0),
      });
    }
    const max = Math.max(1, ...days.map((d) => d.total));
    return { days, max };
  }, [sales]);

  return (
    <LeoShell subtitle="Ventes en temps réel">
      <SectionTitle
        overline="Tableau de bord commercial"
        title="Ventes"
        action={
          <Button size="sm" className="h-10 rounded-full" onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Vente
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Cette semaine" value={formatMoney(stats.week)} />
        <StatCard label="Ce mois" value={formatMoney(stats.month)} />
        <StatCard label="Total" value={formatMoney(stats.total)} />
        <StatCard label="Transactions" value={String(stats.count)} />
      </div>

      <section className="surface-panel mt-4 p-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          14 derniers jours
        </p>
        <div className="mt-4 flex h-28 items-end gap-1">
          {daily.days.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/70"
                style={{ height: `${Math.max(2, (d.total / daily.max) * 100)}%` }}
              />
              <span className="text-[9px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <SectionTitle overline="Répartition" title="Par produit" />
        <ul className="space-y-2">
          {byProduct.rows.map((r) => (
            <li key={r.product} className="surface-panel p-3">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{r.product}</span>
                <span className="tabular-nums">{formatMoney(r.total)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(r.total / byProduct.max) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">{r.count} ventes</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <SectionTitle overline="Historique" title="Dernières ventes" />
        {sales.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune vente enregistrée.</p>
        ) : (
          <ul className="space-y-2">
            {sales.slice(0, 20).map((s) => (
              <li key={s.id} className="surface-panel flex items-center gap-3 p-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.product}</span>
                  <span className="block text-xs text-muted-foreground">
                    {new Date(s.sold_at).toLocaleDateString("fr-FR")} · {s.source} · x{s.quantity}
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatMoney(Number(s.amount), s.currency)}
                </span>
                <button
                  type="button"
                  aria-label="Supprimer la vente"
                  onClick={() => remove.mutate(s.id)}
                  className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground active:bg-muted"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>Enregistrer une vente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Select value={product} onValueChange={setProduct}>
              <SelectTrigger className="h-12">
                <SelectValue />
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
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Montant (€)</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  className="h-12"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Quantité</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  className="h-12"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Date</Label>
              <Input
                type="date"
                className="h-12"
                value={soldAt}
                onChange={(e) => setSoldAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="h-12 w-full rounded-xl"
              onClick={() => {
                save.mutate(
                  {
                    product,
                    amount: Number(amount || 0),
                    quantity: Number(quantity || 1),
                    sold_at: new Date(soldAt).toISOString(),
                    source: "manuel",
                  },
                  {
                    onSuccess: () => {
                      setOpen(false);
                      setAmount("");
                      setQuantity("1");
                    },
                  },
                );
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
