import type { Octokit } from "@octokit/rest";
import { Truncate } from "@primer/react";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import _ from "lodash";
import type { DataLoaderParams } from "~/components";
import { Wrapper } from "~/components";
import { StandardTable } from "~/components";
import { getOctokit, getUser } from "~/octokit.server";

export async function loader({ request }: DataLoaderParams<"">) {
  const octokit = await getOctokit(request);

  const events = await octokit.activity.listEventsForAuthenticatedUser({
    username: (await getUser(request)).login,
  });

  return { events: events.data };
}

type Event = Awaited<
  ReturnType<Octokit["activity"]["listEventsForAuthenticatedUser"]>
>["data"][0];
const columnHelper = createColumnHelper<Event>();

export default function Activity() {
  const { events } = useLoaderData<typeof loader>();

  const distinct = _.chain(events)
    .uniq()
    .map((event) => event.repo.name.split("/") as [string, string])
    .groupBy((pair) => pair[0])
    .mapValues((repos) => repos.map(([_, repo]) => repo))
    .value();

  const tableOptions = {
    data: events,
    columns: [
      columnHelper.accessor("repo.name", { header: "Repository" }),
      columnHelper.accessor("type", { header: "Event Type" }),
      columnHelper.accessor("payload", {
        header: "Event Payload",
        cell: (props) => (
          <Truncate
            title={props.row.original.type || "unknown"}
            expandable
            inline
          >
            <code>
              <pre>{JSON.stringify(props.getValue(), undefined, 2)}</pre>
            </code>
          </Truncate>
        ),
      }),
    ],
  };
  return (
    <Wrapper>
      <></>
      <>
        <ul>
          {Object.entries(distinct).map(([owner, repos]) => (
            <li key={owner}>
              {owner}/
              <ul>
                {repos.map((repo) => (
                  <li key={repo}>{repo}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <StandardTable tableOptions={tableOptions} />
      </>
    </Wrapper>
  );
}
