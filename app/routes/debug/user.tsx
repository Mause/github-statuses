import { authenticator } from "~/services/auth.server";
import type { LoaderFunction } from "@remix-run/node";
import { pick, timeout } from "~/services";

export const loader = (async ({ request }) => {
  return {
    user: await timeout(
      authenticator()
        .isAuthenticated(request)
        .then((userObject) =>
          userObject
            ? pick(userObject, [
                "login",
                "installationId",
                "accessTokenExpiry",
                "refreshTokenExpiry",
              ])
            : null,
        ),
      "isAuthenticated",
    ),
  };
}) satisfies LoaderFunction;
