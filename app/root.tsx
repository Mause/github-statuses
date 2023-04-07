import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from "@remix-run/react";
import { Spinner, ThemeProvider } from "@primer/react";
import styles from "bulma/css/bulma.min.css";
import { Modal } from "react-bulma-components";
import { withSentry } from "@sentry/remix";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Action Statuses",
  viewport: "width=device-width,initial-scale=1",
});

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

function App() {
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

export default withSentry(App);
