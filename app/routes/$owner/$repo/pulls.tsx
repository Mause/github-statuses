import type { Octokit } from "@octokit/rest";
import { json } from "@remix-run/node";
import type { Params } from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import type { SortingState } from "@tanstack/react-table";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { octokit } from "~/octokit.server";
import { StandardTable, Wrapper } from "~/components";
import { useState } from "react";
import type { StandardTableOptions } from "~/components/StandardTable";

export const loader = async ({
  params,
}: {
  params: Params<"repo" | "owner">;
}) => {
  const pulls = await octokit.rest.pulls.list({
    state: "open",
    owner: params.owner!,
    repo: params.repo!,
  });

  return json({ pulls });
};

type PR = Awaited<ReturnType<Octokit["rest"]["pulls"]["list"]>>["data"][0];
const columnHelper = createColumnHelper<PR>();

export default function Pulls() {
  const { pulls } = useLoaderData<typeof loader>();

  const table: StandardTableOptions<PR> = {
    data: pulls.data,
    columns: [
      columnHelper.accessor("number", {
        header: "#",
        cell: (props) => `#${props.getValue()}`,
      }),
      columnHelper.accessor("title", {
        header: "Title",
        cell: (props) => (
          <a href={new URL(props.row.original._links.html.href).pathname}>
            {props.getValue()}
          </a>
        ),
      }),
      columnHelper.accessor("user.login", {
        header: "By",
        cell: (props) => (
          <a
            target="_blank"
            href={props.row.original.user?.html_url}
            rel="noreferrer"
          >
            {props.getValue()}
          </a>
        ),
      }),
    ],
  };

  return (
    <Wrapper>
      {<></>}
      {<StandardTable tableOptions={table} />}
    </Wrapper>
  );
}
