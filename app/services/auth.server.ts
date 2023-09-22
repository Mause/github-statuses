// app/services/auth.server.ts
import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/services/session.server";
import type { components } from "@octokit/openapi-types";
import { gitHubStrategy } from "~/octokit.server";
import _ from "lodash";

export type SessionShape = Pick<
  components["schemas"]["private-user"],
  "login"
> & {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number | null;
};

const DEV = process.env.NODE_ENV == "development";

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export let authenticator = _.memoize(() => {
  if (DEV) {
    console.log("Running in DEV mode");
    const accessToken = process.env.ACCESS_TOKEN;
    return {
      async isAuthenticated(_request: Request, _options: {}) {
        if (!accessToken) {
          throw new Error("Please add dummy access token to .env");
        }
        return {
          accessToken,
          login: "Mause",
          refreshToken: "",
          accessTokenExpiry: null,
        };
      },
      async logout(_request: Request, _options: {}) {},
    };
  }
  const authenticator = new Authenticator<SessionShape>(sessionStorage);
  authenticator.use(gitHubStrategy());
  return authenticator;
});
