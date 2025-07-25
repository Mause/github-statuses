import type { LoaderFunction } from "@remix-run/node";
import { getRootURL } from "~/octokit.server";
import { useLoaderData } from "@remix-run/react";
import { Link } from "@primer/react";

export const loader = (async () => {
  return [
    "env",
    "kv",
    "redirect",
    "rootURL",
    "sentry",
    "user",
    "userExtra",
  ].map((name) => `${getRootURL()}/debug/${name}`);
}) satisfies LoaderFunction;

export default function Debug() {
  const data = useLoaderData<typeof loader>();

  return (
    <ul>
      {data.map((url) => (
        <li key={url}>
          <Link href={url}>{new URL(url).pathname}</Link>
        </li>
      ))}
    </ul>
  );
}
