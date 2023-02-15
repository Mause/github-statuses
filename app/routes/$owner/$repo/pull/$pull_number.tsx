import { json } from "@remix-run/node";
import { Params, useLoaderData } from "@remix-run/react";
import { Octokit } from "@octokit/rest";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { Columns, Container, Table } from "react-bulma-components";

const octokit = new Octokit();

export const loader = async ({ params }: {params: Params<'repo' | 'owner' | 'pull_number'>}) => {
  const args = {repo: params.repo!, owner: params.owner!,pull_number: Number(params.pull_number!)}

  const pr = await octokit.rest.pulls.get(args);
  const statuses = (await octokit.rest.checks.listForRef({
    ...args,
    ref: pr.data.head.sha
  })).data.check_runs.filter(status => !['success', 'skipped'].includes(status.conclusion!));

  return json({statuses});
};

type Check = Awaited<ReturnType<Octokit['rest']['checks']['listForRef']>>['data']['check_runs'][0];

const columnHelper = createColumnHelper<Check>();

export default function Index() {
  const { statuses } = useLoaderData<typeof loader>();

  const table = useReactTable({
    data: statuses,
    columns: [
      columnHelper.accessor('name', {
        cell: props => props.row.renderValue('name'),
        header: 'Name'
      }),
      columnHelper.accessor('conclusion', {
        cell: props => <span>{props.row.renderValue('conclusion')}</span>,
        header:'Conclusion'
      }),
      columnHelper.accessor('html_url', {cell: props => <a href={props.getValue()}>Details</a>, header: 'HTML URL'}),
      columnHelper.accessor('started_at', {cell: props=>props.getValue()}),
    ],
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <Container>
      <Columns>
      <Columns.Column>
      <h1>Welcome to Remix</h1>
      Statuses: { statuses.length }

      <Table>
        <thead>
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
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
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          {table.getFooterGroups().map(footerGroup => (
            <tr key={footerGroup.id}>
              {footerGroup.headers.map(header => (
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

