import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ImportPayload = {
  text?: string;
  file?: { name: string; mimeType: string; dataBase64: string };
};

export const importPinterestReportFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ImportPayload) => {
    const hasText = typeof input?.text === "string" && input.text.trim().length > 0;
    const hasFile = !!input?.file?.dataBase64;
    if (!hasText && !hasFile) throw new Error("Collez un rapport ou déposez un fichier.");
    if (input.file && input.file.dataBase64.length > 20_000_000) {
      throw new Error("Fichier trop lourd (15 Mo maximum).");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const mod = await import("./pinterest-import.server");
    return mod.importPinterestReport(context.userId, data);
  });
