import type { LoaderFunction } from "@remix-run/node";
import { getOctokit } from "~/octokit.server";
import { splatObject } from "~/components";
import { timeout } from "~/services";

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

export const loader = (async ({ request }) => {
  return {
    userExtra: await timeout(getGithubUser(request)),
  };
}) satisfies LoaderFunction;
