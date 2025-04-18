const {createRoutesFromFolders} = require('@remix-run/v1-route-convention');

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  // When running locally in development mode, we use the built in remix
  // server. This does not understand the vercel lambda module format,
  // so we default back to the standard build output.
  ignoredRouteFiles: ["**/.*"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "api/index.js",
  // publicPath: "/build/",
  serverModuleFormat: 'cjs',
  future: {
  },
  routes(defineRoutes) {
    return createRoutesFromFolders(defineRoutes);
  },
  browserNodeBuiltinsPolyfill: {
    modules: {
      url: true,
      path: true,
      os: true,
      crypto: true,
    }
  }
};
