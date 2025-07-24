import type { LoaderFunctionArgs } from "@remix-run/node";

export async function timeout<T>(t: Promise<T>) {
  return await Promise.race([
    t,
    new Promise((resolve) => {
      setTimeout(() => resolve("timed out"), 5000);
    }),
  ]);
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return ["env", "kv", "redirect", "rootURL", "sentry", "user", "userExtra"];
};
