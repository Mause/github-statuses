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
import { Wrapper } from "./components";
import { HeaderContext } from "./components/useHeader";
import { useContext } from "react";

export const meta: MetaFunction = () => ({
  charset: "utf-8",
  title: "Action Statuses",
  viewport: "width=device-width,initial-scale=1",
});

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

function Mini() {
  const { value } = useContext(HeaderContext);
  return (
    <Wrapper>
      {value}
      <Outlet />
    </Wrapper>
  );
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
          <HeaderContext.Provider value={{ value: undefined }}>
            <Mini />
          </HeaderContext.Provider>
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
