import { catchError } from "~/components";
import { logoutAndRedirect } from "~/octokit.server";
import { commitSession, getSession } from "~/services/session.server";

describe("auth", () => {
  it("logs out and redirects", async () => {
    const request = {
      headers: new Headers({
        Cookie: await commitSession(await getSession()),
      }),
      url: new URL("http://localhost"),
    } as unknown as Request;
    expect(request.headers.get("Cookie")).toMatch(/_session/);

    const response = await catchError<Response>(logoutAndRedirect(request));
    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/");

    const session = await getSession(response.headers.getSetCookie()![0]);
    expect(session.data).toEqual({
      __flash_error__: "Your session has expired",
    });
  });
});
