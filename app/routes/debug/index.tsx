import type { LoaderFunction } from "@remix-run/node";
import { getRootURL } from "~/octokit.server";
import { useLoaderData } from "@remix-run/react";

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
          <a href={url}>{url}</a>
        </li>
      ))}
    </ul>
  );
}
