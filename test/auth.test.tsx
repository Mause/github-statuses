import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import { createRemixStub } from "@remix-run/testing";
import { logoutAndRedirect } from "~/octokit.server";
import { commitSession, getSession } from "~/services/session.server";
import * as loginPage from "~/routes/login";
import { renderPrimer } from "./util";
import { authenticator } from "~/services/auth.server";
import { catchError } from "~/components";

describe("auth", () => {
  it("logs out and redirects", async () => {
    const request = new Request("http://localhost");
    request.headers.set("Cookie", await commitSession(await getSession()));
    expect(request.headers.get("Cookie")).toMatch(/_session/);

    const response = await logoutAndRedirect(request);
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");

    const session = await getSession(response.headers.getSetCookie()![0]);
    expect(session.data).toEqual({
      __flash_error__: "Your session has expired",
    });
  });

  it("logged in redirects", async () => {
    const session = await getSession();

    session.set((await authenticator()).sessionKey, {
      id: 1,
      login: "octocat",
    });

    const request = new Request("http://localhost");
    request.headers.set("Cookie", await commitSession(session));
    const res = await catchError<Response>(
      loginPage.loader({
        request,
        params: {},
        context: {},
      }),
    );

    expect(res.status).toBe(302);
    expect(res.headers.get("Location")).toBe("/");
  });

  it("test login page with error", async () => {
    await testLogin("Your session has expired");

    expect(screen.findByText("Login with GitHub")).toBeTruthy();
    expect(screen.queryByTestId("error")).toHaveTextContent(
      "Your session has expired",
    );
  });

  it("test login page without error", async () => {
    await testLogin(undefined);

    expect(screen.findByText("Login with GitHub")).toBeTruthy();
    expect(screen.queryByTestId("error")).toBeFalsy();
  });
});

async function testLogin(error: string | undefined) {
  const Stub = createRemixStub([
    {
      loader: async (args) => {
        const session = await getSession();
        session.flash("error", error);
        args.request.headers.set("Cookie", await commitSession(session));

        return await loginPage.loader(args);
      },
      Component: loginPage.default,
      path: "/",
      id: "root",
    },
  ]);

  await renderPrimer(<Stub />);
}
