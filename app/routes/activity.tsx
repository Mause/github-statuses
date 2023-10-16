import type { Octokit } from "@octokit/rest";
import { Button, Details, useDetails } from "@primer/react";
import { createColumnHelper } from "@tanstack/react-table";
import _ from "lodash";
import type { DataLoaderParams } from "~/components";
import { Wrapper } from "~/components";
import { StandardTable } from "~/components";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
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
  const { events } = useLoaderDataReloading<typeof loader>();

  const distinct = _.chain(events)
    .map(({ repo }) => repo.name)
    .uniq()
    .map((name) => name.split("/") as [string, string])
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
        cell: (props) => <EventPayload event={props.row.original} />,
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
        <StandardTable tableOptions={tableOptions}>
          No pull requests found
        </StandardTable>
      </>
    </Wrapper>
  );
}

function EventPayload({ event }: { event: Event }) {
  const { getDetailsProps } = useDetails({});
  return (
    <Details {...getDetailsProps()} title={event.type || "unknown"}>
      <Button as="summary">Details</Button>
      <pre>
        <code>{JSON.stringify(event, undefined, 2)}</code>
      </pre>
    </Details>
  );
}
