import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "@remix-run/react";
import { renderHeadToString } from "remix-island";
import { ServerStyleSheet } from "styled-components";
import { Head } from "./root";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { renderToPipeableStream } from "react-dom/server";
import * as Sentry from "@sentry/remix";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

const ABORT_DELAY = 7000;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1,
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const sheet = new ServerStyleSheet();

  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      sheet.collectStyles(
        <RemixServer
          context={remixContext}
          url={request.url}
          abortDelay={ABORT_DELAY}
        />,
      ),
      {
        onShellReady() {
          const head = renderHeadToString({ request, remixContext, Head });

          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          const styles = sheet.getStyleTags();

          body.write(
            `<!DOCTYPE html>
              <html>
                <head>
                  ${styles}
                  ${head}
                </head>
                <body>
                  <div id="root">`,
          );
          pipe(body);
          body.write(`
                  </div>
                </body>
              </html>`);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
