import { Table } from "react-bulma-components";
import type { Table as ReactTable } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import style from "styled-components";
import { ChevronUpIcon, ChevronDownIcon } from "@primer/octicons-react";

const StyledHeader = style.div<{ canSort: boolean }>`
  cursor: ${(props) => (props.canSort ? "pointer" : "inherit")}
`;

export default function StandardTable<T>({ table }: { table: ReactTable<T> }) {
  return (
    <Table
      style={{ overflowX: "auto", display: "block", whiteSpace: "nowrap" }}
      striped={true}
      hoverable={true}
    >
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id} colSpan={header.colSpan}>
                {header.isPlaceholder ? null : (
                  <StyledHeader
                    canSort={header.column.getCanSort()}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                    {{
                      asc: (
                        <>
                          {" "}
                          <ChevronUpIcon />
                        </>
                      ),
                      desc: (
                        <>
                          {" "}
                          <ChevronDownIcon />
                        </>
                      ),
                    }[header.column.getIsSorted() as string] ?? null}
                  </StyledHeader>
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
  );
}
