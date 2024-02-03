import {
  configMocks,
  mockIntersectionObserver,
  mockResizeObserver,
} from "jsdom-testing-mocks";
import { act } from "react-dom/test-utils";
import { screen, render } from "@testing-library/react";
import { createRemixStub } from "@remix-run/testing";
import { BaseStyles, ThemeProvider } from "@primer/react";
import { call } from "~/octokit.server";
import type { TypedDocumentString } from "~/components/graphql/graphql";
import { catchError } from "~/components";

configMocks({ act, beforeAll, beforeEach, afterEach, afterAll });
mockIntersectionObserver();
mockResizeObserver();

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
      Component: () => (
        <ThemeProvider>
          <BaseStyles>
            <BasePage asChildRoute={false} />
          </BaseStyles>
        </ThemeProvider>
      ),
      loader: async () => ({ repos: [] }),
      path: "/",
      id: "root",
    },
  ]);

  render(<Stub />);

  await screen.findByText("Action Statuses");
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
