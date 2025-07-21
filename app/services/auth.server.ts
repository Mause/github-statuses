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
  refreshToken?: string;
  installationId?: number;
  accessTokenExpiry: string | number | null;
  refreshTokenExpiry: string | number | null;
};

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export let authenticator = _.memoize(async () => {
  const authenticator = new Authenticator<SessionShape>(sessionStorage);
  authenticator.use(await gitHubStrategy());
  return authenticator;
});
