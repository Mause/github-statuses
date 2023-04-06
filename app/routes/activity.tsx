import { json } from "@remix-run/node";
import gql from "graphql-tag";
import type { DataLoaderParams } from "~/components";
import { getOctokit } from "~/octokit.server";

export async function loader({ request }: DataLoaderParams<"">) {
  const octokit = await getOctokit(request);

  const events = await octokit.activity.listEventsForAuthenticatedUser();

  return json({ events });
}
