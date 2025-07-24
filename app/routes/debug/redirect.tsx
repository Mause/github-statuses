import { getRedirect } from "~/octokit.server";
import { timeout } from ".";
import type { LoaderFunction } from "@remix-run/node";

export const loader = (async ({ request }) => {
  return {
    redirect: await timeout(getRedirect(request)),
  };
}) satisfies LoaderFunction;
