import { screen } from "@testing-library/react";
import { createRemixStub } from "@remix-run/testing";
import { call } from "~/octokit.server";
import type { TypedDocumentString } from "~/components/graphql/graphql";
import { catchError } from "~/components";
import { renderPrimer } from "./util";

test("hello", async () => {
  let BasePage: React.FunctionComponent<{ asChildRoute: boolean }>;
  try {
    BasePage = (await import("~/routes/index")).default;
  } catch (e) {
    console.error(e);
    throw e;
  }

  const Stub = createRemixStub([
    {
      Component: () => <BasePage asChildRoute={false} />,
      loader: async () => ({ repos: [] }),
      path: "/",
      id: "root",
    },
  ]);

  await renderPrimer(<Stub />);

  await screen.findByText("Action Statuses");
});

test('Displays error correctly', async () => {
  let BasePage: React.FunctionComponent<{ asChildRoute: boolean }>;
  let ErrorBoundary: React.FunctionComponent;
  try {
    BasePage = (await import("~/routes/index")).default;
    ErrorBoundary = (await import("~/root")).ErrorBoundary;
  } catch (e) {
    console.error(e);
    throw e;
  }

  const Stub = createRemixStub([
    {
      Component: () => <BasePage asChildRoute={false} />,
      loader: async () => {
        throw new Error("This is an error");
      },
      path: "/",
      id: "root",
      ErrorBoundary
    },
  ]);

  await renderPrimer(<Stub />);

  expect((await screen.findByText("This is an error"))).toBeVisible();
});

test("RequestError instanceof", async () => {
  const request = {
    headers: new Headers({
      Cookie: "session=123",
    }),
  } as unknown as Request;
  const res = await catchError<Response>(
    call(
      request,
      "viewer { login }" as unknown as TypedDocumentString<
        { viewer: { login: string } },
        {}
      >,
    ),
  );
  expect(res).toBeInstanceOf(Response);
  expect(res.status).toEqual(302);
  expect(res.headers.get("location")).toEqual("/login");
});
