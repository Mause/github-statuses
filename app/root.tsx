import type { DataFunctionArgs, V2_MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
  useNavigation,
} from "@remix-run/react";
import { Button, SSRProvider, Spinner, ThemeProvider } from "@primer/react";
// @ts-ignore
import styles from "bulma/css/bulma.min.css";
import { Modal } from "react-bulma-components";
import { withSentry } from "@sentry/remix";
import { createHead } from "remix-island";
import { isRouteErrorResponse, useRouteError } from "@remix-run/react";
import { Wrapper } from "./components";
import { authenticator } from "./services/auth.server";
import { Analytics } from "@vercel/analytics/react";
import { useLoaderDataReloading } from "./components/useRevalidateOnFocus";

export async function loader({ request }: DataFunctionArgs) {
  return json({
    ENV: {
      SENTRY_DSN: process.env.SENTRY_DSN,
    },
    user: await authenticator().isAuthenticated(request),
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
  const navigate = useNavigate();
  const { pathname } = useLocation();
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
  } else if (error instanceof Error && error.message === "Failed to fetch") {
    return (
      <div>
        <h1>Error: {error.name}</h1>
        <Button onClick={() => navigate(pathname)}>Revalidate</Button>
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
          <pre>{JSON.stringify(splatObject(error), undefined, 2)}</pre>
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

export const splatObject = (error: unknown) =>
  Object.assign(
    {},
    error,
    Object.fromEntries(
      Object.entries(Object.getOwnPropertyDescriptors(error)).map(
        ([key, descr]) => [key, descr.value]
      )
    )
  );

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
  const data = useLoaderDataReloading<typeof loader>();
  const navigation = useNavigation();

  return (
    <>
      <ThemeProvider>
        <Analytics />
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

export default withSentry(
  () => (
    <SSRProvider>
      <App />
    </SSRProvider>
  ),
  {
    errorBoundaryOptions: {
      fallback: ErrorBoundary,
    },
  }
);
