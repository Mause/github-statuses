// app/services/auth.server.ts
import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/services/session.server";
import type { components } from "@octokit/openapi-types";

export type SessionShape = Pick<
  components["schemas"]["private-user"],
  "login"
> & {
  accessToken: string;
};

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export let authenticator = new Authenticator<SessionShape>(sessionStorage);
