import { json } from "@remix-run/node";

import { Params, useLoaderData, useRevalidator } from "@remix-run/react";
import { Octokit } from "@octokit/rest";
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
} from "@primer/octicons-react";
import { StyledOcticon } from "@primer/react";

const octokit = new Octokit();

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
    console.log(status.conclusion);
    return !["success", "skipped"].includes(status.conclusion!);
  });

  return json({ statuses, pr });
};

type Check = Awaited<
  ReturnType<Octokit["rest"]["checks"]["listForRef"]>
>["data"]["check_runs"][0];

type Conclusion = Check["conclusion"];

const columnHelper = createColumnHelper<Check>();

export default function Index() {
  const { statuses, pr } = useLoaderData<typeof loader>();

  const iconMap: Record<NonNullable<Conclusion>, Icon> = {
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
  };

  const table = useReactTable({
    data: statuses,
    columns: [
      columnHelper.accessor("name", {
        cell: (props) => props.row.renderValue("name"),
        header: "Name",
      }),
      columnHelper.accessor("conclusion", {
        cell: (props) => (
          <span>
            {iconMap[(props.getValue() as Conclusion)!]({})}
            &nbsp;
            {props.row.renderValue("conclusion")}
          </span>
        ),
        header: "Conclusion",
      }),
      columnHelper.accessor("html_url", {
        cell: (props) => <a href={props.getValue()}>Details</a>,
        header: "HTML URL",
      }),
      columnHelper.accessor("started_at", {
        cell: (props) => props.getValue(),
      }),
      columnHelper.accessor("completed_at", {
        cell: (props) => props.getValue(),
      }),
    ],
    getCoreRowModel: getCoreRowModel(),
  });

  const { revalidate, state } = useRevalidator();
  useInterval(() => revalidate(), 5000);

  return (
    <Container>
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
    </Container>
  );
}
