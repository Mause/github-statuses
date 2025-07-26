import { sentryHandleError } from "@sentry/remix";
import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderToString } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";
import { renderHeadToString } from "remix-island";
import { Head } from "./root";

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
