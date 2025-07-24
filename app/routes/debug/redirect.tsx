import { getRedirect } from "~/octokit.server";
import type { LoaderFunction } from "@remix-run/node";
import { timeout } from "~/services";

export const loader = (async ({ request }) => {
  return {
    redirect: await timeout(getRedirect(request)),
  };
}) satisfies LoaderFunction;
