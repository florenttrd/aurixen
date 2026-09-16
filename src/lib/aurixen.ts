export type ProjectSlug = "aurixen" | "leo-valen" | "danse-du-lion";

export type ProjectMeta = {
  slug: ProjectSlug;
  name: string;
  tagline: string;
  theme: string;
  to: string;
  swatch: string;
};

export const PROJECTS: ProjectMeta[] = [
  {
    slug: "leo-valen",
    name: "Léo Valen",
    tagline: "Produits éducatifs · Pinterest · Analytics",
    theme: "theme-leo",
    to: "/p/leo-valen",
    swatch: "#3d8bff",
  },
  {
    slug: "danse-du-lion",
    name: "Danse du Lion",
    tagline: "Restaurants · Prestations · Disponibilités",
    theme: "theme-lion",
    to: "/p/danse-du-lion",
    swatch: "#d43b2c",
  },
];

export const PROJECT_LABELS: Record<string, string> = {
  aurixen: "Aurixen",
  "leo-valen": "Léo Valen",
  "danse-du-lion": "Danse du Lion",
};

export const PRODUCTS = ["Produit A", "Produit B-1", "Produit B-2", "Produit B-3", "Produit C"];

export const NOTE_CATEGORIES = [
  { value: "idee", label: "Idée" },
  { value: "strategie", label: "Stratégie" },
  { value: "reflexion", label: "Réflexion" },
  { value: "marketing", label: "Marketing" },
  { value: "contenu", label: "Contenu" },
  { value: "produit", label: "Produit" },
  { value: "note", label: "Note" },
];

export const INTEREST_LEVELS = [
  { value: "inconnu", label: "Inconnu" },
  { value: "froid", label: "Froid" },
  { value: "interesse", label: "Intéressé" },
  { value: "client", label: "Client" },
];

export type PinLike = {
  impressions: number;
  saves: number;
  clicks: number;
  outbound_clicks: number;
  manual_score: number | null;
};

/** Weighted composite performance score (0-100), relative to the best pin. */
export function rawPinScore(pin: PinLike): number {
  return (
    pin.impressions * 0.05 + pin.saves * 3 + pin.clicks * 2 + pin.outbound_clicks * 4
  );
}

export function pinScore(pin: PinLike, best: number): number {
  if (pin.manual_score != null) return Math.max(0, Math.min(100, Number(pin.manual_score)));
  const raw = rawPinScore(pin);
  if (best <= 0) return 0;
  return Math.round(Math.min(100, (raw / best) * 100));
}

export function withScores<T extends PinLike>(pins: T[]): (T & { score: number })[] {
  const best = Math.max(0, ...pins.map(rawPinScore));
  return pins.map((p) => ({ ...p, score: pinScore(p, best) }));
}

export function formatMoney(value: number, currency = "EUR") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function monthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // monday first
  const days: (Date | null)[] = Array.from({ length: offset }, () => null);
  const total = new Date(year, month + 1, 0).getDate();
  for (let i = 1; i <= total; i++) days.push(new Date(year, month, i));
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export const MONTH_NAMES = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

export function startOfWeek(d = new Date()) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  c.setDate(c.getDate() - ((c.getDay() + 6) % 7));
  return c;
}

export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
