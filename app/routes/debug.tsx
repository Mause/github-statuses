import type { LoaderFunctionArgs } from "@remix-run/node";
import _ from "lodash";
import { getOctokit, getRootURL, getRedirect } from "~/octokit.server";
import { authenticator } from "~/services/auth.server";
import { splatObject } from "~/components/ErrorBoundary";
import * as Sentry from "@sentry/remix";
import getCache from "~/services/cache";

function pick<T>(obj: T, keys: (keyof T)[]) {
  return _.pick(obj, keys);
}

async function timeout<T>(t: Promise<T>) {
  return await Promise.race([
    t,
    new Promise((resolve) => {
      setTimeout(() => resolve("timed out"), 5000);
    }),
  ]);
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userObject = await timeout(
    authenticator()
      .isAuthenticated(request)
      .then((userObject) =>
        userObject
          ? pick(userObject, [
              "login",
              "installationId",
              "accessTokenExpiry",
              "refreshTokenExpiry",
            ])
          : null,
      ),
  );
  const items: Record<string, Promise<any>> = {
    rootURL: Promise.resolve(getRootURL()),
    redirect: timeout(getRedirect(request)),
    sentry: Promise.resolve(getSentryDsn()),
    user: Promise.resolve(userObject),
    userExtra: timeout(getGithubUser(request)),
    kv: timeout(pingKv()),
    env: Promise.resolve(
      _.pick(process.env, ["VERCEL_ENV", "HOSTNAME", "VERCEL_URL", "PORT"]),
    ),
  };

  return Object.fromEntries(
    await Promise.all(
      Object.entries(items).map(async ([key, value]) => {
        try {
          return [key, await value];
        } catch (e) {
          return [key, splatObject(e as Error)];
        }
      }),
    ),
  );
};

async function getGithubUser(request: Request) {
  let user;
  try {
    const octokit = await getOctokit(request);

    user = (await octokit.rest.users.getAuthenticated()).data;
  } catch (e) {
    user = splatObject(e as Error);
  }
  return user;
}

function getSentryDsn() {
  try {
    return Sentry.getCurrentScope().getClient()?.getDsn() ?? "no dsn found";
  } catch (e) {
    console.error("unable to get sentry", e);
    return `unable to get sentry: ${e}`;
  }
}

async function pingKv() {
  try {
    return await getCache().stat();
  } catch (e) {
    return splatObject(e);
  }
}
