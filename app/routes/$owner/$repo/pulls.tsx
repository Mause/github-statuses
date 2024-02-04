import { Link as PrimerLink } from "@primer/react";
import type { SerializeFrom } from "@remix-run/node";
import { json } from "@remix-run/node";
import { createColumnHelper } from "@tanstack/react-table";
import type { DataLoaderParams } from "~/components";
import {
  StandardTable,
  buildMergeableColumn,
  buildNumberColumn,
  buildRollupColumn,
  buildTitleColumn,
} from "~/components";
import type { StandardTableOptions } from "~/components/StandardTable";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import type { PullRequest } from "./pullsQuery";
import { getPullRequests } from "./pullsQuery";

export const loader = async ({
  params,
  request,
}: DataLoaderParams<"repo" | "owner">) => {
  return json(
    await getPullRequests(request, {
      owner: params.owner!,
      repo: params.repo!,
    }),
  );
};

const columnHelper = createColumnHelper<SerializeFrom<PullRequest>>();

export default function Pulls() {
  const { pulls } = useLoaderDataReloading<typeof loader>();

  const table: StandardTableOptions<SerializeFrom<PullRequest>> = {
    data: pulls,
    columns: [
      buildNumberColumn(),
      buildTitleColumn(),
      columnHelper.accessor("author.login", {
        header: "By",
        cell: (props) => (
          <PrimerLink
            target="_blank"
            href={props.row.original.author?.url}
            rel="noreferrer"
          >
            {props.getValue()}
          </PrimerLink>
        ),
      }),
      buildMergeableColumn<PullRequest>(),
      buildRollupColumn<PullRequest>(),
    ],
  };

  return (
    <StandardTable tableOptions={table}>No pull requests found</StandardTable>
  );
}
