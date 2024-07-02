import { vitePlugin as remix } from "@remix-run/dev";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { envOnlyMacros } from "vite-env-only";
import { nodePolyfills } from "vite-plugin-node-polyfills";

import tsconfigPaths from "vite-tsconfig-paths";
import { createRoutesFromFolders } from "@remix-run/v1-route-convention";

function op(): Plugin {
  return {
    name: "remix-op",
    transform(code, id) {
      console.log("transform", id);
      return code;
    },
  };
}

export default defineConfig({
  plugins: [
    op(),
    nodePolyfills(),
    envOnlyMacros(),
    remix({
      // When running locally in development mode, we use the built in remix
      // server. This does not understand the vercel lambda module format,
      // so we default back to the standard build output.
      ignoredRouteFiles: ["**/.*"],
      // appDirectory: "app",
      // assetsBuildDirectory: "public/build",
      // serverBuildPath: "api/index.js",
      // publicPath: "/build/",
      serverModuleFormat: "cjs",
      future: {},
      routes(defineRoutes) {
        return createRoutesFromFolders(defineRoutes);
      },
    }),
    tsconfigPaths(),
  ],
});
