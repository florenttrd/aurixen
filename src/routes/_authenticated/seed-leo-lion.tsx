import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { findModuleDef } from "@/lib/modules";

export const Route = createFileRoute("/_authenticated/seed-leo-lion")({ component: SeedPage });

const SETS = [
  { slug: "leo-valen", name: "Léo Valen", subtitle: "Produits éducatifs · Pinterest", accent: "#3d8bff", accent_secondary: "#8b5cf6", surface: "encre", modules: ["dashboard", "journal", "calendrier", "notes", "fichiers", "taches"] },
  { slug: "danse-du-lion", name: "Danse du Lion", subtitle: "Prestations pour restaurants", accent: "#d43b2c", accent_secondary: "#f59e0b", surface: "noir", modules: ["dashboard", "journal", "calendrier", "notes", "fichiers", "taches"] },
];

function SeedPage() {
  const [msg, setMsg] = useState("");
  async function seed() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setMsg("Pas de session"); return; }
    const user_id = u.user.id;
    for (const s of SETS) {
      const { data: existing } = await supabase.from("projects").select("id").eq("slug", s.slug).maybeSingle();
      if (!existing) {
        await supabase.from("projects").insert({
          user_id, slug: s.slug, name: s.name, subtitle: s.subtitle, tagline: s.subtitle,
          initials: s.name.slice(0, 2).toUpperCase(), accent: s.accent, accent_secondary: s.accent_secondary, surface: s.surface,
        });
      }
      const rows = s.modules.map((key, i) => {
        const def = findModuleDef(key);
        return { user_id, project_slug: s.slug, module_key: key, kind: def?.kind ?? "universel", label: def?.label ?? key, icon: def?.icon ?? "box", enabled: true, position: i, fields: (def?.fields ?? []) };
      });
      await supabase.from("project_modules").upsert(rows, { onConflict: "user_id,project_slug,module_key" });
    }
    setMsg("Terminé. Léo Valen et Danse du Lion sont des projets. Vous pouvez supprimer ce fichier.");
  }
  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold">Seed Léo Valen & Danse du Lion</h1>
      <p className="mt-2 text-sm text-muted-foreground">Crée les deux projets de base avec leurs modules universels. Visitez cette page une fois, puis retirez ce fichier.</p>
      <Button className="mt-4 h-12 rounded-xl" onClick={seed}>Lancer le seed</Button>
      {msg ? <p className="mt-3 text-sm">{msg}</p> : null}
    </div>
  );
}
