import getCache, { throwError } from "~/services/cache";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader: LoaderFunction = async () => {
  const cache = getCache() ?? throwError("Cache not found");
  await cache.set("foo", "bar");
  return { foo: await cache.get("foo"), stat: await cache.stat() };
};

export default function Cache() {
  const data = useLoaderData<typeof loader>();
  return <>Ok: {JSON.stringify(data)}</>;
}
