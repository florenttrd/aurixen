import { createContext, useContext } from "react";
import type { Project, ProjectModule } from "@/hooks/useProjectSystem";

type Ctx = { project: Project; modules: ProjectModule[]; slug: string };
export const ProjectCtx = createContext<Ctx | null>(null);

export function useProjectCtx(): Ctx {
  const c = useContext(ProjectCtx);
  if (!c) throw new Error("useProjectCtx doit être utilisé dans /p/$slug");
  return c;
}
