import getCache from "~/services/cache";
import type { LoaderFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const loader: LoaderFunction = async () => {
  const cache = await getCache();
  await cache.set("foo", "bar");
  return await cache.get("foo");
};

export default function Cache() {
  const data = useLoaderData<typeof loader>();
  return <>Ok: {data}</>;
}
