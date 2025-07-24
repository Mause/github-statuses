import type { LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  let paths: string[] | null = ["inaccessible"];
  try {
    paths = require.resolve.paths("*.tsx");
  } catch {}

  return {
    manual: ["env", "kv", "redirect", "rootURL", "sentry", "user", "userExtra"],
    paths,
  };
};
