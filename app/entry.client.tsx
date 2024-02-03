import { RemixBrowser, useLocation, useMatches } from "@remix-run/react";
import { startTransition, StrictMode, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydrationOverlay } from "@builder.io/react-hydration-overlay";

import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: window.ENV.SENTRY_DSN,
  tracesSampleRate: 1,
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.remixRouterInstrumentation(
        useEffect,
        useLocation,
        useMatches,
      ),
    }),
  ],
});

function hydrate() {
  startTransition(() => {
    hydrateRoot(
      document.getElementById("root")!,
      <HydrationOverlay>
        <StrictMode>
          <RemixBrowser />
        </StrictMode>
      </HydrationOverlay>,
    );
  });
}

if (typeof requestIdleCallback === "function") {
  requestIdleCallback(hydrate);
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  setTimeout(hydrate, 1);
}
