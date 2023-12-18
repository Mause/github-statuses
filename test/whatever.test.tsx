import { screen, render } from "@testing-library/react";
import { unstable_createRemixStub as createRemixStub } from "@remix-run/testing";

import { UNSAFE_RemixContext } from "@remix-run/react";
import type {
  DataRouteObject,
  IndexRouteObject,
  NonIndexRouteObject,
} from "react-router-dom";
import type { ActionFunction, LoaderFunction } from "@remix-run/server-runtime";
import { json } from "@remix-run/node";
import { useContext } from "react";

interface StubIndexRouteObject
  extends Omit<IndexRouteObject, "loader" | "action"> {
  loader?: LoaderFunction;
  action?: ActionFunction;
}
interface StubNonIndexRouteObject
  extends Omit<NonIndexRouteObject, "loader" | "action"> {
  loader?: LoaderFunction;
  action?: ActionFunction;
}
type StubRouteObject = StubIndexRouteObject | StubNonIndexRouteObject;
type StubDataRouteObject = StubRouteObject & {
  children?: DataRouteObject[];
  id: string;
};

test("hello", async () => {
  // let BasePage: React.FunctionComponent<{ asChildRoute: boolean }>;
  // try {
  //   BasePage = (await import("~/routes/index")).default;
  // } catch (e) {
  //   console.error(e);
  //   throw e;
  // }

  const Stub = createRemixStub([
    {
      // Component: () => <BasePage asChildRoute={false} />,
      Component: () => {
        useContext(UNSAFE_RemixContext);
        return <div>hello</div>;
      },
      loader: async () => json({ repos: [] }),
      path: "/",
      id: "root",
    } satisfies StubDataRouteObject,
  ]);

  render(<Stub initialEntries={["/"]} />);

  await screen.findByText("hello");
});
