import {
  Book,
  Box,
  CalendarDays,
  CheckSquare,
  Euro,
  FolderOpen,
  Handshake,
  LayoutGrid,
  NotebookPen,
  Search,
  Shapes,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

const ICONS: Record<string, ReactNode> = {
  layout: <LayoutGrid className="size-5" />,
  book: <Book className="size-5" />,
  calendar: <CalendarDays className="size-5" />,
  pen: <NotebookPen className="size-5" />,
  folder: <FolderOpen className="size-5" />,
  check: <CheckSquare className="size-5" />,
  search: <Search className="size-5" />,
  users: <Users className="size-5" />,
  target: <Target className="size-5" />,
  handshake: <Handshake className="size-5" />,
  euro: <Euro className="size-5" />,
  sparkles: <Sparkles className="size-5" />,
  box: <Box className="size-5" />,
  canvas: <Shapes className="size-5" />,
};

export function moduleIcon(key?: string | null): ReactNode {
  return ICONS[key ?? "box"] ?? ICONS["box"];
}

export function ModuleIcon({ name, className }: { name: string | null | undefined; className?: string }) {
  return <span className={`inline-flex shrink-0 items-center justify-center [&>svg]:size-full ${className ?? ""}`}>{moduleIcon(name ?? "box")}</span>;
}
