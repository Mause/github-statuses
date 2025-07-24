import { authenticator } from "~/services/auth.server";
import type { LoaderFunction } from "@remix-run/node";
import { pick } from "lodash";
import { timeout } from "~/services";

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
    ),
  };
}) satisfies LoaderFunction;
