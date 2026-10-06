// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const EXCALIDRAW_STUB = "\0excalidraw-ssr-stub";

// Excalidraw touches `window` at module load. In the server bundle it got merged
// with shared chunks (jsx runtime), crashing every SSR page. Replace it with a stub
// on the server; the editor only renders in the browser.
const excalidrawSsrStub = {
  name: "excalidraw-ssr-stub",
  enforce: "pre" as const,
  resolveId(this: { environment?: { name: string } }, id: string, _importer?: string, opts?: { ssr?: boolean }) {
    const isServer = opts?.ssr || (this.environment && this.environment.name !== "client");
    if (!isServer) return null;
    if (id === "@excalidraw/excalidraw") return EXCALIDRAW_STUB;
    if (id === "@excalidraw/excalidraw/index.css") return EXCALIDRAW_STUB + ".css";
    return null;
  },
  load(id: string) {
    if (id === EXCALIDRAW_STUB + ".css") return "export default {}";
    if (id === EXCALIDRAW_STUB) {
      return [
        "const Noop = () => null;",
        "export const Excalidraw = Noop; export const MainMenu = Object.assign(Noop, { DefaultItems: new Proxy({}, { get: () => Noop }), Item: Noop, Separator: Noop });",
        "export const convertToExcalidrawElements = () => []; export const CaptureUpdateAction = { IMMEDIATELY: 'IMMEDIATELY', NEVER: 'NEVER', EVENTUALLY: 'EVENTUALLY' }; export const exportToBlob = async () => null;",
        "export default {};",
      ].join("\n");
    }
    return null;
  },
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: { plugins: [excalidrawSsrStub] },
});
