import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";
import { renderHeadToString } from 'remix-island';
import { Head } from './root';

import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1,
});

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  const head = renderHeadToString({ request, remixContext, Head });
  const sheet = new ServerStyleSheet();

  let markup = renderToString(
    sheet.collectStyles(
      <RemixServer context={remixContext} url={request.url} />
    )
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
      </html>`, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
