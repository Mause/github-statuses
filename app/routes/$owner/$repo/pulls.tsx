import { Octokit } from "@octokit/rest";
import { LinkExternalIcon } from "@primer/octicons-react";
import { Box, Header } from "@primer/react";
import { json } from "@remix-run/node";
import { Params, useLoaderData } from "@remix-run/react";
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Container } from "react-bulma-components";
import { octokit } from "~/octokit.server";
import StandardTable from "~/StandardTable";

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
          <a href={new URL(props.row.getValue("_links.html.href")).pathname}>
            {props.getValue()}
          </a>
        ),
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Container>
      <Box>
        <Header>
          <Header.Item>
            <Header.Link href="/">Action Statuses</Header.Link>
          </Header.Item>
        </Header>
        <StandardTable table={table} />
      </Box>
    </Container>
  );
}
