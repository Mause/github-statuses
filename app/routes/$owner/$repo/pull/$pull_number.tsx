import { json, TypedResponse } from "@remix-run/node";

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
  MarkGithubIcon,
} from "@primer/octicons-react";
import {
  Avatar,
  Box,
  BranchName,
  Header,
  Pagehead,
  StyledOcticon,
} from "@primer/react";
import { octokit } from "../../../../octokit.server";
import { getWorkflowName } from "./getWorkflowName";

export const loader = async ({
  params,
}: {
  params: Params<"repo" | "owner" | "pull_number">;
}): Promise<TypedResponse<ReturnShape>> => {
  const args = {
    repo: params.repo!,
    owner: params.owner!,
    pull_number: Number(params.pull_number!),
  };

  const pr = await octokit.rest.pulls.get(args);
  if (pr.status !== 200) {
    throw new Error(JSON.stringify(pr.data));
  }
  const statuses = (
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
    return !["success", "skipped"].includes(status.conclusion!);
  });

  const augmentedStatuses = await Promise.all(
    statuses.map(async (status: Check): Promise<Item> => {
      const started_at = Date.parse(status.started_at!);
      const poi = Date.parse(status.completed_at!) || Date.now();

      const milliseconds = poi - started_at;

      return Object.assign(status, {
        workflowName: await getWorkflowName(
          params.owner!,
          params.repo!,
          getRunId(status)
        ),
        duration: Math.round(milliseconds / 1000),
      });
    })
  );

  return json({ statuses: augmentedStatuses, pr: pr.data });
};

type PR = Awaited<ReturnType<Octokit["rest"]["pulls"]["get"]>>["data"];

type Check = Awaited<
  ReturnType<Octokit["rest"]["checks"]["listForRef"]>
>["data"]["check_runs"][0];

type Conclusion = Check["conclusion"];
type Status = Check["status"];

type Item = Check & { workflowName: string; duration: number };
type ReturnShape = { statuses: Item[]; pr: PR };

const columnHelper = createColumnHelper<Item>();

function divmod(x: number, divisor: number) {
  return [Math.floor(x / divisor), x % divisor];
}

function getRunId(status: Check): number {
  const details_url = status.details_url!;

  const match = /runs\/(\d+)\/jobs/.exec(details_url);
  if (!match) {
    throw new Error(`Unable to find id in ${details_url}`);
  }
  return Number(match[1]);
}

export default function Index() {
  const { statuses, pr } = useLoaderData<typeof loader>();

  const color = (component: Icon, color: string) => () =>
    <StyledOcticon icon={component} size={32} color={color} />;

  const iconMap: Record<NonNullable<Conclusion | Status>, Icon> = {
    success: color(CheckIcon, "success.fg"),
    failure: color(XIcon, "danger.fg"),

    skipped: SkipIcon,
    cancelled: StopIcon,

    // guesses
    action_required: XIcon,
    neutral: QuestionIcon,
    timed_out: color(ClockIcon, "danger.fg"),
    in_progress: color(DotIcon, "attention.fg"),
    completed: XIcon,
    queued: HourglassIcon,
  };

  const table = useReactTable({
    data: statuses,
    columns: [
      columnHelper.accessor("workflowName", {
        cell: (props) => props.row.renderValue("workflowName"),
        header: "Workflow Name",
      }),
      columnHelper.accessor("name", {
        cell: (props) => props.row.renderValue("name"),
        header: "Job Name",
      }),
      columnHelper.accessor("conclusion", {
        cell: (props) => {
          const conclusion =
            (props.row.getValue("conclusion") as Conclusion) || "in_progress";

          let c = conclusion.split("_").join(" ");
          c = c.slice(0, 1).toUpperCase() + c.slice(1);

          return (
            <span>
              {iconMap[conclusion]({})}
              &nbsp;
              {c}
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
      columnHelper.accessor("duration", {
        cell: (props) => {
          let [minutes, seconds] = divmod(props.row.getValue("duration"), 60);

          return `${minutes} minutes, ${seconds} seconds`;
        },
        header: "Duration",
      }),
      columnHelper.accessor("completed_at", {
        cell: (props) => props.getValue(),
        header: "Completed At",
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  const { revalidate, state } = useRevalidator();
  useInterval(() => revalidate(), 30000);

  return (
    <Container>
      <Box
        sx={{
          overflowY: "auto",
          border: "1px solid",
          borderRadius: "6px",
          borderColor: "border.default",
        }}
      >
        <Header>
          <Header.Item>
            <Header.Link href="#">
              <StyledOcticon icon={MarkGithubIcon} size={32} sx={{ mr: 2 }} />
              <span>GitHub Statuses</span>
            </Header.Link>
          </Header.Item>
          <Header.Item>{pr.title}</Header.Item>
          <Header.Item>Status: {state}</Header.Item>
          <Header.Item full>
            <BranchName>{pr.head.label}</BranchName>
          </Header.Item>
          <Header.Item>Statuses: {statuses.length}</Header.Item>
        </Header>
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
      </Box>
    </Container>
  );
}
