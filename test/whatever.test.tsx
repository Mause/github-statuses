import { screen } from "@testing-library/react";
import { createRemixStub } from "@remix-run/testing";
import { call } from "~/octokit.server";
import {
  GetUserPullRequestsDocument,
  IssueOrderField,
  OrderDirection,
  type TypedDocumentString,
} from "~/components/graphql/graphql";
import { catchError } from "~/components";
import { renderPrimer } from "./util";
import { Octokit } from "@octokit/rest";
import { vitest } from "vitest";

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

test("Displays error correctly", async () => {
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
      ErrorBoundary,
    },
  ]);

  await renderPrimer(<Stub />);

  expect(await screen.findByText("This is an error")).toBeVisible();
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

test("graphql", async () => {
  const request = {
    headers: new Headers({
      Cookie: "session=123",
    }),
    octokit: new Octokit(),
  } as unknown as Request;
  const error = vitest.spyOn(console, "error");
  const warn = vitest.spyOn(console, "warn");
  let res = await call(request, GetUserPullRequestsDocument, {
    order: {
      field: IssueOrderField.UpdatedAt,
      direction: OrderDirection.Desc,
    },
    owner: "octocat",
  });
  expect(res).toMatchSnapshot();
  expect(error).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledTimes(2);
  expect(error.mock.calls).toMatchSnapshot();
  expect(warn.mock.calls).toMatchSnapshot();
});
