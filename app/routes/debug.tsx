import type { DataFunctionArgs } from "@remix-run/node";
import _ from "lodash";
import { getUserNoRedirect, rootURL } from "~/octokit.server";

export const loader = async ({ request }: DataFunctionArgs) => ({
  rootURL,
  user: (await getUserNoRedirect(request))?.login || null,
  env: _.pick(process.env, ["VERCEL_ENV", "HOSTNAME", "VERCEL_URL", "PORT"]),
});
