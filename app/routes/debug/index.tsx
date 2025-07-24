import type { LoaderFunctionArgs } from "@remix-run/node";
import { readdir } from "fs/promises";

export async function timeout<T>(t: Promise<T>) {
  return await Promise.race([
    t,
    new Promise((resolve) => {
      setTimeout(() => resolve("timed out"), 5000);
    }),
  ]);
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return readdir(import.meta.dirname);
};
