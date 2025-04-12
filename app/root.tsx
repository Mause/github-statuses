import type {
  LoaderFunction,
  MetaFunction,
  SerializeFrom,
} from "@remix-run/node";
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
  useMatches,
  useNavigation,
} from "@remix-run/react";
import { BaseStyles, Spinner, ThemeProvider, themeGet } from "@primer/react";
import { withSentry } from "@sentry/remix";
import { createHead } from "remix-island";
import {
  Wrapper,
  ErrorBoundary as ErrorDisplay,
  titleCase,
} from "./components";
import { authenticator } from "./services/auth.server";
import { Analytics } from "@vercel/analytics/react";
import { useLoaderDataReloading } from "./components/useRevalidateOnFocus";
import _ from "lodash";
import type { ReactNode } from "react";
import { colorModeCookie } from "./components/cookies.server";
type ColorModeWithAuto = Parameters<typeof ThemeProvider>[0]["colorMode"];

export const loader: LoaderFunction = async ({ request }) => {
  const colorMode = (await colorModeCookie.parse(
    request.headers.get("cookie"),
  )) as ColorModeWithAuto;

  return json({
    ENV: {
      SENTRY_DSN: process.env.SENTRY_DSN,
    },
    user: _.pick(await authenticator().isAuthenticated(request), ["login"]),
    colorMode: colorMode ?? "auto",
  });
};

export const meta: MetaFunction = () => [
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
    <Wrapper>
      <></>
      <ErrorDisplay />
    </Wrapper>
  );
}

function Loading() {
  const navigation = useNavigation();

  if (navigation.state === "idle") {
    return undefined;
  }

  return (
    <Dialog
      title={`${titleCase(navigation.state)}...`}
      width="medium"
      height="auto"
      onClose={() => {}}
    >
      On your way to <code>{navigation.location.pathname}</code>
      <br />
      <Spinner size="large" sx={{ alignContent: "center" }} />
    </Dialog>
  );
}

const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${themeGet("colors.canvas.default")}};
  }
`;

export function Layout({ children }: { children: ReactNode[] | ReactNode }) {
  const matches = useMatches();
  const data = matches[0] as SerializeFrom<typeof loader>;

  return (
    <ThemeProvider colorMode={data?.colorMode ?? "auto"}>
      <BaseStyles>
        <Analytics />
        <GlobalStyle></GlobalStyle>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <Loading />
        {children}
      </BaseStyles>
    </ThemeProvider>
  );
}

function App() {
  const data = useLoaderDataReloading<typeof loader>();

  return (
    <>
      <Outlet />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
        }}
      />
    </>
  );
}

export default withSentry(() => <App />, {
  errorBoundaryOptions: {
    fallback: <ErrorBoundary />,
  },
});
