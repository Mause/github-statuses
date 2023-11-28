import type { DataFunctionArgs } from "@remix-run/node";
import { kv } from "@vercel/kv";
import _ from "lodash";
import { getOctokit, getRootURL } from "~/octokit.server";
import { authenticator } from "~/services/auth.server";
import { splatObject } from "~/components/ErrorBoundary";

export const loader = async ({ request }: DataFunctionArgs) => {
  let user;
  try {
    const octokit = await getOctokit(request);

    user = (await octokit.rest.users.getAuthenticated()).data;
  } catch (e) {
    user = splatObject(e as Error);
  }

  const userObject = await authenticator().isAuthenticated(request);
  return {
    rootURL: getRootURL(),
    user: userObject
      ? _.pick(userObject, ["login", "accessTokenExpiry"])
      : null,
    userExtra: user,
    kv: await pingKv(),
    env: _.pick(process.env, ["VERCEL_ENV", "HOSTNAME", "VERCEL_URL", "PORT"]),
  };
};

async function pingKv() {
  try {
    return await kv.ping();
  } catch (e) {
    return e;
  }
}
