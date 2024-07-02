import { sentryHandleError } from "@sentry/remix";
import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";
import { renderHeadToString } from "remix-island";
import { Head } from "./root";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import * as Sentry from "@sentry/remix";

if ("SENTRY_DSN" in process.env) {
  console.log("Sentry is starting...");
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [nodeProfilingIntegration(), Sentry.debugIntegration()],
    debug: true,
    tracesSampleRate: 1,
    autoInstrumentRemix: true,
  });
} else {
  console.log("No SENTRY_DSN found in process.env");
}

export const handleError = sentryHandleError;

const ABORT_DELAY = 7000;

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
        </body>
      </html>`,
    {
      headers: responseHeaders,
      status: responseStatusCode,
    },
  );
}
