import type { DataFunctionArgs, V2_MetaFunction } from "@remix-run/node";
import { createGlobalStyle } from "styled-components";
import { json } from "@remix-run/node";
import { Dialog } from "@primer/react/drafts";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigation,
} from "@remix-run/react";
import { BaseStyles, Spinner, ThemeProvider, themeGet } from "@primer/react";
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

export const Head = createHead(() => (
  <>
    <Meta />
    <Links />
  </>
));

export function ErrorBoundary() {
  return (
    <ThemeProvider>
      <BaseStyles>
        <Meta />
        <Links />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <Wrapper>
          <></>
          <ErrorDisplay />
        </Wrapper>
        <Loading />
      </BaseStyles>
    </ThemeProvider>
  );
}

function Loading() {
  const navigation = useNavigation();

  return navigation.state !== "idle" ? (
    <Dialog onClose={() => {}}>
      <Spinner size="large" sx={{ alignContent: "center" }} />
    </Dialog>
  ) : undefined;
}

const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${themeGet("colors.canvas.default")}};
  }
`;

function RealApp() {
  const data = useLoaderDataReloading<typeof loader>();

  return (
    <>
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
      <Loading />
    </>
  );
}

function App() {
  return (
    <>
      <ThemeProvider colorMode="auto">
        <BaseStyles>
          <GlobalStyle></GlobalStyle>
          <RealApp />
        </BaseStyles>
      </ThemeProvider>
    </>
  );
}

export default withSentry(() => <App />, {
  errorBoundaryOptions: {
    fallback: <ErrorBoundary />,
  },
});
