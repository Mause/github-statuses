import { authenticator } from "~/services/auth.server";
import type { LoaderFunction } from "@remix-run/node";
import { pick, timeout } from "~/services";

export const loader = (async ({ request }) => {
  return {
    user: await timeout(
      authenticator()
        .isAuthenticated(request)
        .then((userObject) => {
          if (!userObject) {
            return null;
          }
          return {
            ...pick(userObject, [
              "login",
              "installationId",
              "accessTokenExpiry",
              "refreshTokenExpiry",
            ]),
            url: `https://github.com/apps/action-statuses/installations/${userObject.installationId}`,
          };
        }),
      "isAuthenticated",
    ),
  };
}) satisfies LoaderFunction;
