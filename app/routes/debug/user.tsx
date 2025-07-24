import { authenticator } from "~/services/auth.server";
import { timeout } from ".";
import type { LoaderFunction } from "@remix-run/node";
import { pick } from "lodash";

export const loader = (async ({ request }) => {
  const userObject = await timeout(
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
  );
  return { user: Promise.resolve(userObject) };
}) satisfies LoaderFunction;
