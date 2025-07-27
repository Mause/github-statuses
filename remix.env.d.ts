/// <reference types="@remix-run/dev" />
/// <reference types="@remix-run/node" />

interface Window {
  ENV: { SENTRY_DSN: string };
}

declare module "@remix-run/server-runtime" {
  // or cloudflare, deno, etc.
  interface Future {
    v3_singleFetch: true;
  }
}
