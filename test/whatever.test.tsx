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
