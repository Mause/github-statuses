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

function App() {
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();

  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
        {typeof document === "undefined" ? "__STYLES__" : null}
      </head>
      <body>
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
      </body>
    </html>
  );
}

export default withSentry(() => (
  <SSRProvider>
    <App />
  </SSRProvider>
));
