import { Octokit } from "@octokit/rest";
import { json } from "@remix-run/node";
import { Params, useLoaderData } from "@remix-run/react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { octokit } from "~/octokit.server";
import StandardTable from "~/StandardTable";
import Wrapper from "~/Wrapper";

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
  });

  return (
    <Wrapper>
      {<></>}
      {<StandardTable table={table} />}
    </Wrapper>
  );
}
