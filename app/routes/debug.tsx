import type { DataFunctionArgs } from "@remix-run/node";
import _ from "lodash";
import { getRootURL } from "~/octokit.server";
import { authenticator } from "~/services/auth.server";

export const loader = async ({ request }: DataFunctionArgs) => ({
  rootURL: getRootURL(),
  user: (await authenticator().isAuthenticated(request))?.login || null,
  env: _.pick(process.env, ["VERCEL_ENV", "HOSTNAME", "VERCEL_URL", "PORT"]),
});
