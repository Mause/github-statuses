import { Octokit } from "@octokit/rest";
import { json } from "@remix-run/node";
import { Params, useLoaderData } from "@remix-run/react";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { octokit } from "~/octokit.server";
import { StandardTable, Wrapper } from "~/components";
import { useState } from "react";

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
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data: pulls.data,
    columns: [
      columnHelper.accessor("title", {
        header: "Title",
        cell: (props) => (
          <a href={new URL(props.row.original._links.html.href).pathname}>
            {props.getValue()}
          </a>
        ),
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  return (
    <Wrapper>
      {<></>}
      {<StandardTable table={table} />}
    </Wrapper>
  );
}
