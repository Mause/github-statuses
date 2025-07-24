import { getRedirect } from "~/octokit.server";
import { timeout } from ".";
import type { LoaderFunction } from "@remix-run/node";

export const loader = (({ request }) => {
  return {
    redirect: timeout(getRedirect(request)),
  };
}) satisfies LoaderFunction;
