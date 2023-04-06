import type { DataLoaderParams } from "~/components";
import { getOctokit, getUser } from "~/octokit.server";

export async function loader({ request }: DataLoaderParams<"">) {
  const octokit = await getOctokit(request);

  const events = await octokit.activity.listEventsForAuthenticatedUser({
    username: (await getUser(request)).login,
  });

  return { events: events.data };
}
