/**
 * AURIXEN module architecture.
 *
 * A project is a workspace = a set of modules + a theme + a home layout.
 * Modules come in three kinds:
 *  - "universel"   : available to every project (dashboard, journal, calendar, notes, files, tasks, search)
 *  - "specialise"  : opt-in domain modules (pinterest, gumroad, analytics, restaurants, crm...)
 *  - "custom"      : user-defined modules, stored as records with their own fields
 *
 * Universal modules have dedicated routes. Specialised / custom modules are
 * rendered by the generic record space at /p/$slug/m/$moduleKey, which reads the
 * module's `fields` definition. That keeps the door open for a full module
 * builder later without another migration.
 */

export type ModuleKind = "universel" | "specialise" | "custom";

export type ModuleField = {
  key: string;
  label: string;
  type: "texte" | "nombre" | "montant" | "date" | "email" | "telephone" | "long" | "statut";
};

export type ModuleDef = {
  key: string;
  label: string;
  kind: ModuleKind;
  icon: string;
  description: string;
  /** route suffix for universal modules; generic record space when absent */
  path?: string;
  fields?: ModuleField[];
};

export const UNIVERSAL_MODULES: ModuleDef[] = [
  {
    key: "dashboard",
    label: "Accueil",
    kind: "universel",
    icon: "layout",
    description: "Vue d'ensemble personnalisable du projet",
    path: "",
  },
  {
    key: "journal",
    label: "Journal",
    kind: "universel",
    icon: "book",
    description: "Journal de bord et mémoire du projet",
    path: "journal",
  },
  {
    key: "calendrier",
    label: "Calendrier",
    kind: "universel",
    icon: "calendar",
    description: "Événements, échéances et planification",
    path: "calendrier",
  },
  {
    key: "notes",
    label: "Notes",
    kind: "universel",
    icon: "pen",
    description: "Écriture, idées, stratégies",
    path: "notes",
  },
  {
    key: "fichiers",
    label: "Fichiers",
    kind: "universel",
    icon: "folder",
    description: "Dossiers et documents du projet",
    path: "fichiers",
  },
  {
    key: "taches",
    label: "Tâches",
    kind: "universel",
    icon: "check",
    description: "À faire, priorités et échéances",
    path: "taches",
  },
  {
    key: "recherche",
    label: "Recherche",
    kind: "universel",
    icon: "search",
    description: "Recherche dans tout le projet",
    path: "recherche",
  },
];

const STATUS_FIELD: ModuleField = { key: "statut", label: "Statut", type: "statut" };

export const SPECIALISED_MODULES: ModuleDef[] = [
  {
    key: "clients",
    label: "Clients",
    kind: "specialise",
    icon: "users",
    description: "Fiches clients : contact, statut, montant",
    fields: [
      { key: "telephone", label: "Téléphone", type: "telephone" },
      { key: "email", label: "Email", type: "email" },
      STATUS_FIELD,
      { key: "montant", label: "Montant", type: "montant" },
      { key: "notes", label: "Notes", type: "long" },
    ],
  },
  {
    key: "prospects",
    label: "Prospects",
    kind: "specialise",
    icon: "target",
    description: "Prospection : contact, intérêt, relance",
    fields: [
      { key: "ville", label: "Ville", type: "texte" },
      { key: "telephone", label: "Téléphone", type: "telephone" },
      { key: "email", label: "Email", type: "email" },
      STATUS_FIELD,
      { key: "relance", label: "Relance", type: "date" },
      { key: "notes", label: "Notes", type: "long" },
    ],
  },
  {
    key: "crm",
    label: "CRM",
    kind: "specialise",
    icon: "handshake",
    description: "Suivi des relations et des opportunités",
    fields: [
      { key: "contact", label: "Contact", type: "texte" },
      { key: "email", label: "Email", type: "email" },
      STATUS_FIELD,
      { key: "valeur", label: "Valeur", type: "montant" },
      { key: "prochaine_action", label: "Prochaine action", type: "texte" },
      { key: "notes", label: "Notes", type: "long" },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    kind: "specialise",
    icon: "euro",
    description: "Entrées, sorties et suivi des montants",
    fields: [
      { key: "montant", label: "Montant", type: "montant" },
      { key: "date", label: "Date", type: "date" },
      { key: "categorie", label: "Catégorie", type: "texte" },
      STATUS_FIELD,
      { key: "notes", label: "Notes", type: "long" },
    ],
  },
  {
    key: "prestations",
    label: "Prestations",
    kind: "specialise",
    icon: "sparkles",
    description: "Prestations, disponibilités et lieux",
    fields: [
      { key: "lieu", label: "Lieu", type: "texte" },
      { key: "date", label: "Date", type: "date" },
      { key: "tarif", label: "Tarif", type: "montant" },
      STATUS_FIELD,
      { key: "notes", label: "Notes", type: "long" },
    ],
  },
  {
    key: "inventaire",
    label: "Inventaire",
    kind: "specialise",
    icon: "box",
    description: "Matériel, stock et emplacements",
    fields: [
      { key: "quantite", label: "Quantité", type: "nombre" },
      { key: "emplacement", label: "Emplacement", type: "texte" },
      STATUS_FIELD,
      { key: "notes", label: "Notes", type: "long" },
    ],
  },
];

export const MODULE_CATALOG = [...UNIVERSAL_MODULES, ...SPECIALISED_MODULES];

export function findModuleDef(key: string): ModuleDef | undefined {
  return MODULE_CATALOG.find((m) => m.key === key);
}

export const DEFAULT_MODULE_KEYS = ["dashboard", "journal", "calendrier", "notes", "fichiers"];

/* ------------------------------- home blocks ---------------------------- */

export type HomeBlock = {
  /** module key the block reads from */
  module: string;
  /** visual weight */
  size: "petit" | "moyen" | "grand";
};

export const HOME_BLOCK_LABELS: Record<string, string> = {
  taches: "À faire",
  calendrier: "Prochains événements",
  journal: "Dernières entrées du journal",
  notes: "Dernières notes",
  fichiers: "Derniers fichiers",
};

export function defaultHomeLayout(moduleKeys: string[]): HomeBlock[] {
  const order = ["taches", "calendrier", "journal", "notes", "fichiers"];
  const blocks: HomeBlock[] = order
    .filter((k) => moduleKeys.includes(k))
    .map((module) => ({ module, size: "moyen" as const }));
  const records = moduleKeys.filter(
    (k) => !UNIVERSAL_MODULES.some((u) => u.key === k),
  );
  return [...blocks, ...records.map((module) => ({ module, size: "petit" as const }))];
}

/* --------------------------------- theme -------------------------------- */

export type SurfaceKey = "noir" | "encre" | "ardoise" | "clair";
export type EffectsKey = "aucun" | "doux" | "moyen" | "intense";

export const SURFACES: { key: SurfaceKey; label: string; swatch: string }[] = [
  { key: "noir", label: "Noir profond", swatch: "#14100c" },
  { key: "encre", label: "Encre bleutée", swatch: "#0d1120" },
  { key: "ardoise", label: "Ardoise", swatch: "#16181a" },
  { key: "clair", label: "Clair", swatch: "#f6f5f2" },
];

export const FONT_DISPLAY_OPTIONS = [
  { key: "serif-luxe", label: "Serif luxe", stack: '"Cormorant Garamond", Georgia, serif' },
  { key: "sans-tech", label: "Sans technique", stack: '"Space Grotesk", system-ui, sans-serif' },
  { key: "editorial", label: "Éditorial", stack: '"Playfair Display", Georgia, serif' },
  { key: "grotesque", label: "Grotesque", stack: '"Manrope", system-ui, sans-serif' },
  { key: "mono", label: "Monospace", stack: '"JetBrains Mono", ui-monospace, monospace' },
];

export const FONT_BODY_OPTIONS = [
  { key: "sans-moderne", label: "Sans moderne", stack: '"Inter Tight", system-ui, sans-serif' },
  { key: "grotesque", label: "Grotesque", stack: '"Manrope", system-ui, sans-serif' },
  { key: "serif", label: "Serif", stack: '"Cormorant Garamond", Georgia, serif' },
  { key: "mono", label: "Monospace", stack: '"JetBrains Mono", ui-monospace, monospace' },
];

export const EFFECTS_OPTIONS: { key: EffectsKey; label: string }[] = [
  { key: "aucun", label: "Aucun" },
  { key: "doux", label: "Doux" },
  { key: "moyen", label: "Moyen" },
  { key: "intense", label: "Intense" },
];

export const ACCENT_PRESETS = [
  "#c9a84c",
  "#3d8bff",
  "#d43b2c",
  "#2fbf87",
  "#a855f7",
  "#f97316",
  "#e5e7eb",
];
