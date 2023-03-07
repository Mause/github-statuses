import type { DataFunctionArgs } from "@remix-run/node";
import _ from "lodash";
import { getUserNoRedirect, getRootURL } from "~/octokit.server";

export const loader = async ({ request }: DataFunctionArgs) => ({
  rootURL: getRootURL(),
  user: (await getUserNoRedirect(request))?.login || null,
  env: _.pick(process.env, ["VERCEL_ENV", "HOSTNAME", "VERCEL_URL", "PORT"]),
});
