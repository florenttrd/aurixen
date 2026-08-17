import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  FileText,
  Image as ImageIcon,
  NotebookPen,
  Store,
  Receipt,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { PROJECT_LABELS, formatDate } from "@/lib/aurixen";

type Hit = {
  id: string;
  kind: string;
  icon: ReactNode;
  title: string;
  detail: string;
  to: string;
};

async function searchAll(term: string): Promise<Hit[]> {
  const q = `%${term}%`;
  const [notes, pins, restaurants, events, files, sales] = await Promise.all([
    supabase.from("notes").select("*").or(`title.ilike.${q},content.ilike.${q}`).limit(12),
    supabase
      .from("pins")
      .select("*")
      .or(`title.ilike.${q},description.ilike.${q},product.ilike.${q},notes.ilike.${q}`)
      .limit(12),
    supabase
      .from("restaurants")
      .select("*")
      .or(`name.ilike.${q},location.ilike.${q},cuisine.ilike.${q},notes.ilike.${q}`)
      .limit(12),
    supabase.from("events").select("*").or(`title.ilike.${q},description.ilike.${q}`).limit(12),
    supabase.from("files").select("*").ilike("name", q).limit(12),
    supabase.from("sales").select("*").ilike("product", q).limit(12),
  ]);

  const hits: Hit[] = [];

  for (const n of notes.data ?? [])
    hits.push({
      id: `note-${n.id}`,
      kind: "Note",
      icon: <NotebookPen className="size-4" />,
      title: n.title || "Note sans titre",
      detail: `${PROJECT_LABELS[n.project_slug] ?? n.project_slug} · ${n.content.slice(0, 60)}`,
      to:
        n.project_slug === "leo-valen"
          ? "/leo/notes"
          : n.project_slug === "danse-du-lion"
            ? "/lion/notes"
            : "/hub",
    });

  for (const p of pins.data ?? [])
    hits.push({
      id: `pin-${p.id}`,
      kind: "Pin",
      icon: <ImageIcon className="size-4" />,
      title: p.title,
      detail: `${p.status === "publie" ? "Publié" : "Créé"} · ${p.product ?? "Sans produit"}`,
      to: "/leo/pins",
    });

  for (const r of restaurants.data ?? [])
    hits.push({
      id: `resto-${r.id}`,
      kind: "Restaurant",
      icon: <Store className="size-4" />,
      title: r.name,
      detail: [r.location, r.cuisine].filter(Boolean).join(" · ") || "Restaurant chinois",
      to: "/lion/restaurants",
    });

  for (const e of events.data ?? [])
    hits.push({
      id: `event-${e.id}`,
      kind: "Événement",
      icon: <CalendarDays className="size-4" />,
      title: e.title,
      detail: `${formatDate(e.event_date)} · ${PROJECT_LABELS[e.project_slug] ?? e.project_slug}`,
      to:
        e.project_slug === "leo-valen"
          ? "/leo/calendrier"
          : e.project_slug === "danse-du-lion"
            ? "/lion/calendrier"
            : "/hub",
    });

  for (const f of files.data ?? [])
    hits.push({
      id: `file-${f.id}`,
      kind: "Fichier",
      icon: <FileText className="size-4" />,
      title: f.name,
      detail: PROJECT_LABELS[f.project_slug] ?? f.project_slug,
      to: "/leo/fichiers",
    });

  for (const s of sales.data ?? [])
    hits.push({
      id: `sale-${s.id}`,
      kind: "Vente",
      icon: <Receipt className="size-4" />,
      title: s.product,
      detail: `${Number(s.amount).toFixed(2)} € · ${formatDate(s.sold_at)}`,
      to: "/leo/ventes",
    });

  return hits;
}

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [term, setTerm] = useState("");
  const enabled = open && term.trim().length >= 2;

  const { data, isFetching } = useQuery({
    queryKey: ["search", term.trim()],
    queryFn: () => searchAll(term.trim()),
    enabled,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-4 max-h-[85vh] translate-y-0 gap-3 overflow-hidden p-4 sm:top-1/2 sm:-translate-y-1/2">
        <DialogHeader className="text-left">
          <DialogTitle className="text-base">Recherche globale</DialogTitle>
        </DialogHeader>
        <Input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Idées, notes, pins, restaurants, fichiers…"
          className="h-12 text-base"
        />
        <div className="-mx-1 max-h-[55vh] overflow-y-auto px-1">
          {!enabled ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Tapez au moins 2 caractères.
            </p>
          ) : isFetching ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Recherche…</p>
          ) : (data?.length ?? 0) === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Aucun résultat.</p>
          ) : (
            <ul className="space-y-2">
              {data!.map((hit) => (
                <li key={hit.id}>
                  <Link
                    to={hit.to}
                    onClick={() => onOpenChange(false)}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 active:bg-muted"
                  >
                    <span className="mt-0.5 text-primary">{hit.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{hit.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {hit.detail}
                      </span>
                    </span>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {hit.kind}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
