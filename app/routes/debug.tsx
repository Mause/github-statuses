import type { LoaderFunctionArgs } from "@remix-run/node";
import _ from "lodash";
import { getOctokit, getRootURL, getRedirect } from "~/octokit.server";
import { authenticator } from "~/services/auth.server";
import { splatObject } from "~/components/ErrorBoundary";
import getCache from "~/services/cache";

function pick<T>(obj: T, keys: (keyof T)[]) {
  return _.pick(obj, keys);
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
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
    redirect: await getRedirect(request),
    user: userObject
      ? pick(userObject, [
          "login",
          "installationId",
          "accessTokenExpiry",
          "refreshTokenExpiry",
        ])
      : null,
    userExtra: user,
    kv: await pingKv(),
    env: _.pick(process.env, ["VERCEL_ENV", "HOSTNAME", "VERCEL_URL", "PORT"]),
  };
};

async function pingKv() {
  try {
    return await getCache().stat();
  } catch (e) {
    return splatObject(e);
  }
}
