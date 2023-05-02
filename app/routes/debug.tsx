import type { DataFunctionArgs } from "@remix-run/node";
import kv from '@vercel/kv';
import _ from "lodash";
import { getOctokit, getRootURL } from "~/octokit.server";
import { authenticator } from "~/services/auth.server";
import { splatObject } from "../root";

export const loader = async ({ request }: DataFunctionArgs) => {
  let user;
  try {
    const octokit = await getOctokit(request);

    user = (await octokit.rest.users.getAuthenticated()).data;
  } catch (e) {
    user = splatObject(e as Error);
  }

  return {
    rootURL: getRootURL(),
    user: (await authenticator().isAuthenticated(request))?.login || null,
    userExtra: user,
    kv: await kv.ping(),
    env: _.pick(process.env, ["VERCEL_ENV", "HOSTNAME", "VERCEL_URL", "PORT"]),
  };
};
