// Catalogue des connecteurs AURIXEN — partagé navigateur/serveur, sans aucun secret.

export type ConnectorCategory = "data" | "storage" | "organisation" | "communication" | "research" | "ai";
export type ConnectorAvailability = "available" | "setup_required" | "soon";
export type ConnectorStatus =
  | "not_connected"
  | "connected"
  | "syncing"
  | "synced"
  | "error"
  | "reauth_required"
  | "setup_required"
  | "soon";

export type ConnectorPermission = { key: string; label: string; default: boolean };
export type ConnectorMode = { key: string; label: string; description: string; availability: ConnectorAvailability };

export type ConnectorDef = {
  id: string;
  name: string;
  category: ConnectorCategory;
  icon: string; // emoji, neutre vis-à-vis du thème
  description: string;
  provider: string;
  authType: "api_token" | "oauth" | "report_import" | "managed_oauth" | "none";
  capabilities: string[];
  permissions: ConnectorPermission[];
  syncMethods: ("manual" | "import")[];
  supportedEntities: string[];
  availability: ConnectorAvailability;
  modes?: ConnectorMode[];
  /** Module / page qui consomme ces données. */
  manageHref?: string;
};

export const CONNECTOR_CATEGORIES: { key: ConnectorCategory; label: string; icon: string }[] = [
  { key: "data", label: "Données & Analytics", icon: "📊" },
  { key: "storage", label: "Fichiers & stockage", icon: "📁" },
  { key: "organisation", label: "Organisation", icon: "📅" },
  { key: "communication", label: "Communication", icon: "💬" },
  { key: "research", label: "Recherche & données externes", icon: "🌍" },
  { key: "ai", label: "IA", icon: "🤖" },
];

const soon = (
  id: string,
  name: string,
  category: ConnectorCategory,
  icon: string,
  description: string,
  provider: string,
): ConnectorDef => ({
  id,
  name,
  category,
  icon,
  description,
  provider,
  authType: "oauth",
  capabilities: [],
  permissions: [],
  syncMethods: [],
  supportedEntities: [],
  availability: "soon",
});

export const CONNECTORS: ConnectorDef[] = [
  {
    id: "gumroad",
    name: "Gumroad",
    category: "data",
    icon: "💸",
    description: "Ventes et produits Gumroad",
    provider: "Gumroad",
    authType: "api_token",
    capabilities: ["read_sales", "read_products"],
    permissions: [
      { key: "read_sales", label: "Lire les ventes", default: true },
      { key: "read_products", label: "Lire les produits", default: true },
      { key: "write", label: "Modifier", default: false },
    ],
    syncMethods: ["manual"],
    supportedEntities: ["sale"],
    availability: "available",
    manageHref: "/parametres/integrations",
  },
  {
    id: "pinterest",
    name: "Pinterest",
    category: "data",
    icon: "📌",
    description: "Pins, tableaux et analytics Pinterest",
    provider: "Pinterest",
    authType: "report_import",
    capabilities: ["read_pins", "read_boards", "read_analytics"],
    permissions: [
      { key: "read_pins", label: "Lire les Pins", default: true },
      { key: "read_boards", label: "Lire les Boards", default: true },
      { key: "read_analytics", label: "Lire les Analytics", default: true },
      { key: "publish", label: "Publier", default: false },
      { key: "write", label: "Modifier", default: false },
    ],
    syncMethods: ["import"],
    supportedEntities: ["pin"],
    availability: "available",
    modes: [
      {
        key: "report",
        label: "Import de rapport",
        description: "Rapport ChatGPT (texte ou fichier) lu par l'IA",
        availability: "available",
      },
      {
        key: "oauth",
        label: "Connexion officielle",
        description: "Nécessite un accès développeur Pinterest (PINTEREST_CLIENT_ID / PINTEREST_CLIENT_SECRET)",
        availability: "setup_required",
      },
    ],
    manageHref: "/parametres/import-pinterest",
  },
  soon("google_analytics", "Google Analytics", "data", "📈", "Audience et trafic du site", "Google"),
  soon("google_search_console", "Google Search Console", "data", "🔎", "Référencement et requêtes", "Google"),
  soon("youtube", "YouTube", "data", "▶️", "Vidéos et statistiques de chaîne", "Google"),
  soon("instagram", "Instagram", "data", "📷", "Publications et statistiques", "Meta"),
  soon("tiktok", "TikTok", "data", "🎵", "Vidéos et statistiques", "TikTok"),
  soon("shopify", "Shopify", "data", "🛍️", "Commandes et produits", "Shopify"),
  soon("etsy", "Etsy", "data", "🧵", "Ventes et annonces", "Etsy"),
  {
    id: "google_drive",
    name: "Google Drive",
    category: "storage",
    icon: "🗂️",
    description: "Références vers vos fichiers Drive, sans copie",
    provider: "Google",
    authType: "managed_oauth",
    capabilities: ["list_files", "read_metadata"],
    permissions: [
      { key: "list_files", label: "Lister les dossiers autorisés", default: true },
      { key: "read_metadata", label: "Lire les infos des fichiers", default: true },
      { key: "write", label: "Modifier ou supprimer", default: false },
    ],
    syncMethods: ["manual"],
    supportedEntities: ["drive_file"],
    availability: "available",
  },
  soon("dropbox", "Dropbox", "storage", "📦", "Fichiers Dropbox", "Dropbox"),
  soon("onedrive", "OneDrive", "storage", "☁️", "Fichiers OneDrive", "Microsoft"),
  soon("google_calendar", "Google Calendar", "organisation", "📅", "Agenda Google", "Google"),
  soon("outlook_calendar", "Outlook Calendar", "organisation", "🗓️", "Agenda Outlook", "Microsoft"),
  soon("gmail", "Gmail", "communication", "✉️", "E-mails Gmail", "Google"),
  soon("outlook", "Outlook", "communication", "📨", "E-mails Outlook", "Microsoft"),
  soon("google_places", "Google Maps / Places", "research", "🗺️", "Lieux et fiches établissements", "Google"),
  soon("openai", "OpenAI", "ai", "✳️", "Modèles OpenAI", "OpenAI"),
  soon("anthropic", "Anthropic", "ai", "🅰️", "Modèles Claude", "Anthropic"),
];

export const findConnector = (id: string) => CONNECTORS.find((c) => c.id === id);

export const STATUS_UI: Record<ConnectorStatus, { dot: string; label: string }> = {
  not_connected: { dot: "🔴", label: "Non connecté" },
  connected: { dot: "🟢", label: "Connecté" },
  syncing: { dot: "🟠", label: "Synchronisation…" },
  synced: { dot: "🟢", label: "Synchronisé" },
  error: { dot: "🔴", label: "Erreur" },
  reauth_required: { dot: "🟠", label: "Reconnexion requise" },
  setup_required: { dot: "⚪", label: "À configurer" },
  soon: { dot: "⚪", label: "Bientôt disponible" },
};

/** Statut connu par le serveur, sans aucune donnée sensible. */
export type ConnectorStatusDTO = {
  connector_id: string;
  status: ConnectorStatus;
  account_id: string | null;
  account_label: string | null;
  last_sync_at: string | null;
  items_count: number;
  last_error: string | null;
  missing: string[];
};
