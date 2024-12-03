/// <reference types="vite/client" />
/// <reference types="@remix-run/node" />

interface Window {
  ENV: { SENTRY_DSN: string };
}
