import type { DataFunctionArgs, V2_MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from "@remix-run/react";
import { SSRProvider, Spinner, ThemeProvider } from "@primer/react";
// @ts-ignore
import styles from "bulma/css/bulma.min.css";
import { Modal } from "react-bulma-components";
import { withSentry } from "@sentry/remix";
import { createHead } from "remix-island";
import { Wrapper, ErrorBoundary as ErrorDisplay } from "./components";
import { authenticator } from "./services/auth.server";
import { Analytics } from "@vercel/analytics/react";
import { useLoaderDataReloading } from "./components/useRevalidateOnFocus";
import _ from "lodash";

export async function loader({ request }: DataFunctionArgs) {
  return json({
    ENV: {
      SENTRY_DSN: process.env.SENTRY_DSN,
    },
    user: _.pick(await authenticator().isAuthenticated(request), ["login"]),
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

export function ErrorBoundary() {
  const navigation = useNavigation();

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
      <Modal
        show={navigation.state !== "idle"}
        closeOnEsc={false}
        showClose={false}
      >
        <Spinner size="large" sx={{ color: "whitesmoke" }} />
      </Modal>
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
      fallback: <ErrorBoundary />,
    },
  }
);
