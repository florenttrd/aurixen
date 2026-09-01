import {
  BarChart3,
  CalendarDays,
  Images,
  LayoutGrid,
  NotebookPen,
  Receipt,
  Settings,
  Store,
} from "lucide-react";

import type { NavItem } from "./Shell";

export const HUB_NAV: NavItem[] = [
  { to: "/hub", label: "Projets", icon: <LayoutGrid className="size-5" />, exact: true },
  { to: "/calendrier", label: "Calendrier", icon: <CalendarDays className="size-5" /> },
  { to: "/notes", label: "Écriture", icon: <NotebookPen className="size-5" /> },
  { to: "/parametres", label: "Réglages", icon: <Settings className="size-5" /> },
];

export const LEO_NAV: NavItem[] = [
  { to: "/leo", label: "Dashboard", icon: <BarChart3 className="size-5" />, exact: true },
  { to: "/leo/pins", label: "Pins", icon: <Images className="size-5" /> },
  { to: "/leo/ventes", label: "Ventes", icon: <Receipt className="size-5" /> },
  { to: "/leo/calendrier", label: "Agenda", icon: <CalendarDays className="size-5" /> },
  { to: "/leo/notes", label: "Écriture", icon: <NotebookPen className="size-5" /> },
];

export const LION_NAV: NavItem[] = [
  { to: "/lion", label: "Dashboard", icon: <LayoutGrid className="size-5" />, exact: true },
  { to: "/lion/restaurants", label: "Restaurants", icon: <Store className="size-5" /> },
  { to: "/lion/calendrier", label: "Calendrier", icon: <CalendarDays className="size-5" /> },
  { to: "/lion/notes", label: "Écriture", icon: <NotebookPen className="size-5" /> },
];
