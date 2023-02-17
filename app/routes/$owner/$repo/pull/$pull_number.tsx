import { json } from "@remix-run/node";

import { Params, useLoaderData, useRevalidator } from "@remix-run/react";
import type { Octokit } from "@octokit/rest";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Columns, Container, Table } from "react-bulma-components";
import { useInterval } from "react-interval-hook";
import {
  SkipIcon,
  XIcon,
  StopIcon,
  CheckIcon,
  Icon,
  QuestionIcon,
  ClockIcon,
  HourglassIcon,
  DotIcon,
} from "@primer/octicons-react";
import { Box, StyledOcticon } from "@primer/react";
import lodash from "lodash";
import { octokit } from "../../../../octokit.server";

const getWorkflowName = lodash.memoize(
  async function (owner: string, repo: string, run_id: number) {
    const workflow_run = await octokit.rest.actions.getWorkflowRun({
      run_id,
      owner,
      repo,
    });

    return workflow_run.data.name;
  },
  (...args) => args.join("-")
);

export const loader = async ({
  params,
}: {
  params: Params<"repo" | "owner" | "pull_number">;
}) => {
  const args = {
    repo: params.repo!,
    owner: params.owner!,
    pull_number: Number(params.pull_number!),
  };

  const pr = await octokit.rest.pulls.get(args);
  if (pr.status !== 200) {
    throw new Error(JSON.stringify(pr.data));
  }
  let statuses = (
    await octokit.paginate(
      octokit.rest.checks.listForRef,
      {
        ...args,
        ref: pr.data.head.sha,
      },
      (response) => {
        if (response.status !== 200) {
          throw new Error(JSON.stringify(response.data));
        }
        return response.data;
      }
    )
  ).filter((status) => {
    // console.log(status.conclusion);
    return !["success", "skipped"].includes(status.conclusion!);
  });

  statuses = await Promise.all(
    statuses.map(async (status) => {
      (status as any).workflowName = await getWorkflowName(
        params.owner!,
        params.repo!,
        getRunId(status)
      );
      return status;
    })
  );

  return json({ statuses, pr });
};

type Check = Awaited<
  ReturnType<Octokit["rest"]["checks"]["listForRef"]>
>["data"]["check_runs"][0];

type Conclusion = Check["conclusion"];
type Status = Check["status"];

const columnHelper = createColumnHelper<Check>();

function getRunId(status: Check): number {
  const details_url = status.details_url!;
  console.log({ details_url });
  const match = /runs\/(\d+)\/jobs/.exec(details_url);
  console.log({ match });
  if (!match) {
    throw new Error(`Unable to find id in ${details_url}`);
  }
  return Number(match[1]);
}

export default function Index() {
  const { statuses, pr } = useLoaderData<typeof loader>();

  const iconMap: Record<NonNullable<Conclusion | Status>, Icon> = {
    success: () => (
      <StyledOcticon icon={CheckIcon} size={32} color="success.fg" />
    ),
    failure: () => <StyledOcticon icon={XIcon} size={32} color="danger.fg" />,

    skipped: SkipIcon,
    cancelled: StopIcon,

    // guesses
    action_required: XIcon,
    neutral: QuestionIcon,
    timed_out: ClockIcon,
    in_progress: DotIcon,
    completed: XIcon,
    queued: HourglassIcon,
  };

  const table = useReactTable({
    data: statuses,
    columns: [
      columnHelper.accessor("name", {
        cell: (props) =>
          props.row.renderValue("workflowName") +
          " / " +
          props.row.renderValue("name"),
        header: "Name",
      }),
      columnHelper.accessor("conclusion", {
        cell: (props) => {
          const conclusion =
            (props.row.getValue("conclusion") as Conclusion) || "in_progress";

          return (
            <span>
              {iconMap[conclusion]({})}
              &nbsp;
              {conclusion}
            </span>
          );
        },
        header: "Status",
      }),
      columnHelper.accessor("html_url", {
        cell: (props) => <a href={props.getValue()}>Details</a>,
        header: "Details",
      }),
      columnHelper.accessor("started_at", {
        cell: (props) => props.getValue(),
        header: "Started At",
      }),
      columnHelper.accessor("completed_at", {
        cell: (props) => props.getValue(),
        header: "Completed At",
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  const { revalidate, state } = useRevalidator();
  useInterval(() => revalidate(), 5000);

  return (
    <Container>
      <Box>
        <Columns>
          <Columns.Column>
            <h1>{pr.title}</h1>
            Statuses: {statuses.length}
            <br />
            {state}
            <Table>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {table.getFooterGroups().map((footerGroup) => (
                  <tr key={footerGroup.id}>
                    {footerGroup.headers.map((header) => (
                      <th key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.footer,
                              header.getContext()
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </tfoot>
            </Table>
          </Columns.Column>
        </Columns>
      </Box>
    </Container>
  );
}
