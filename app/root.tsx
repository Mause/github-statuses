import type { V2_MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { SSRProvider, Spinner, ThemeProvider } from "@primer/react";
// @ts-ignore
import styles from "bulma/css/bulma.min.css";
import { Modal } from "react-bulma-components";
import { withSentry } from "@sentry/remix";
import { createHead } from "remix-island";
import { isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { RequestError } from "@octokit/request-error";
import { Wrapper } from "./components";

export async function loader() {
  return json({
    ENV: {
      SENTRY_DSN: process.env.SENTRY_DSN,
    },
  });
}

export const meta: V2_MetaFunction = () => [
  { name: "charset", content: "utf-8" },
  { title: "Action Statuses" },
  { name: "viewport", content: "width=device-width,initial-scale=1" },
];

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

export const Head = createHead(() => (
  <>
    <Meta />
    <Links />
  </>
));

function ErrorDisplay() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error: {error.name}</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <code>
          <pre>{error.stack}</pre>
        </code>
        <code>
          <pre>
            {JSON.stringify(
              Object.entries(Object.getOwnPropertyDescriptors(error)).map(
                ([key, descr]) => [key, descr.value]
              ),
              undefined,
              2
            )}
          </pre>
        </code>
      </div>
    );
  } else {
    return (
      <div>
        <h1>Unknown Error</h1>
        <code>
          <pre>{JSON.stringify(error, undefined, 2)}</pre>
        </code>
      </div>
    );
  }
}

export function ErrorBoundary() {
  return (
    <ThemeProvider>
      <Meta />
      <Links />
      <ScrollRestoration />
      <Scripts />
      <LiveReload />
      <Wrapper>
        <></>
        <ErrorDisplay />
      </Wrapper>
    </ThemeProvider>
  );
}

function App() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  return (
    <>
      <ThemeProvider>
        <Outlet />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <Modal
          show={navigation.state !== "idle"}
          closeOnEsc={false}
          showClose={false}
        >
          <Spinner size="large" sx={{ color: "whitesmoke" }} />
        </Modal>
      </ThemeProvider>
    </>
  );
}

export default withSentry(() => (
  <SSRProvider>
    <App />
  </SSRProvider>
));
