import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";
import { renderHeadToString } from "remix-island";
import { Head } from "./root";

import * as Sentry from "@sentry/remix";
import { ProfilingIntegration } from "@sentry/profiling-node";

const ABORT_DELAY = 7000;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [new ProfilingIntegration()],
  tracesSampleRate: 1,
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

const hydrationErrors = `
window.BUILDER_HYDRATION_OVERLAY = {APP_ROOT_SELECTOR: '#root'};
window.addEventListener("error", (event) => {
  const msg = event.message.toLowerCase();
  const isHydrationMsg = msg.includes("hydration") || msg.includes("hydrating");

  if (isHydrationMsg) {
    window.BUILDER_HYDRATION_OVERLAY.ERROR = true;
    let appRootEl = document.querySelector(
      window.BUILDER_HYDRATION_OVERLAY.APP_ROOT_SELECTOR
    );

    if (appRootEl) {
      window.BUILDER_HYDRATION_OVERLAY.CSR_HTML = appRootEl.innerHTML;
    }
  }
});

let BUILDER_HYDRATION_OVERLAY_ELEMENT = document.querySelector(
  window.BUILDER_HYDRATION_OVERLAY.APP_ROOT_SELECTOR
);
if (BUILDER_HYDRATION_OVERLAY_ELEMENT) {
  window.BUILDER_HYDRATION_OVERLAY.SSR_HTML =
    BUILDER_HYDRATION_OVERLAY_ELEMENT.innerHTML;
}
`;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const head = renderHeadToString({ request, remixContext, Head });
  const sheet = new ServerStyleSheet();

  let markup = renderToString(
    sheet.collectStyles(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
    ),
  );
  const styles = sheet.getStyleTags();

  responseHeaders.set("Content-Type", "text/html");

  return new Response(
    `<!DOCTYPE html>
      <html>
        <head>
          ${styles}
          ${head}
        </head>
        <body>
          <div id="root">
            ${markup}
          </div>
          <script>
          ${hydrationErrors}
          </script>
        </body>
      </html>`,
    {
      headers: responseHeaders,
      status: responseStatusCode,
    },
  );
}
