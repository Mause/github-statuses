import type { SerializeFrom } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { Params } from "@remix-run/react";
import { Link } from "@remix-run/react";
import { useLoaderData } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { StandardTable, Wrapper } from "~/components";
import type { StandardTableOptions } from "~/components/StandardTable";
import { titleCase } from "./pull/titleCase";
import type { PRWithRollup } from "./pullsQuery";
import { getPullRequests } from "./pullsQuery";

export const loader = async ({
  params,
}: {
  params: Params<"repo" | "owner">;
}) => {
  return json({
    pulls: await getPullRequests({ owner: params.owner!, repo: params.repo! }),
  });
};

const columnHelper = createColumnHelper<SerializeFrom<PRWithRollup>>();

export default function Pulls() {
  const { pulls } = useLoaderData<typeof loader>();

  const table: StandardTableOptions<SerializeFrom<PRWithRollup>> = {
    data: pulls,
    columns: [
      columnHelper.accessor("number", {
        header: "#",
        cell: (props) => `#${props.getValue()}`,
      }),
      columnHelper.accessor("title", {
        header: "Title",
        cell: (props) => (
          <Link to={new URL(props.row.original.permalink).pathname}>
            {props.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("author.login", {
        header: "By",
        cell: (props) => (
          <a
            target="_blank"
            href={props.row.original.author?.url}
            rel="noreferrer"
          >
            {props.getValue()}
          </a>
        ),
      }),
      columnHelper.accessor("mergeable", {
        header: "Mergability",
        cell: (props) => titleCase(props.getValue()),
      }),
      columnHelper.accessor("rollup", {
        header: "Rollup",
        cell: (props) => JSON.stringify(props.getValue()),
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
