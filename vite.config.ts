import { unstable_vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";

import tsconfigPaths from "vite-tsconfig-paths";
import { createRoutesFromFolders } from "@remix-run/v1-route-convention";

export default defineConfig({
  plugins: [
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
