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
};

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export let authenticator = _.memoize(() => {
  const authenticator = new Authenticator<SessionShape>(sessionStorage);
  authenticator.use(gitHubStrategy());
  return authenticator;
});
