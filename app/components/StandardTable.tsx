import { Table } from "react-bulma-components";
import type {
  Column,
  ColumnFiltersState,
  SortingState,
  TableOptions,
  Table as ReactTable,
} from "@tanstack/react-table";
import {
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import style from "styled-components";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  SearchIcon,
} from "@primer/octicons-react";
import { useMemo, useState } from "react";
import { fuzzyFilter } from "./fuzzyFilter";
import { Select, TextInput } from "@primer/react";

const StyledHeader = style.div<{ canSort: boolean }>`
  cursor: ${(props) => (props.canSort ? "pointer" : "inherit")}
`;

export type StandardTableOptions<T> = Pick<TableOptions<T>, "data" | "columns">;

export default function StandardTable<T>({
  tableOptions,
}: {
  tableOptions: StandardTableOptions<T>;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    ...tableOptions,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    globalFilterFn: fuzzyFilter,
    debugTable: true,
    debugHeaders: true,
    debugColumns: false,
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
    onSortingChange: setSorting,
  });

  return (
    <>
      <TextInput
        onChange={(event) => setGlobalFilter(event.target.value)}
        leadingVisual={SearchIcon}
      />
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
                    <>
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

                      {header.column.getCanFilter() && (
                        <div>
                          <Filter column={header.column} table={table} />
                        </div>
                      )}
                    </>
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
    </>
  );
}

function Filter({
  column,
  table,
}: {
  column: Column<any, unknown>;
  table: ReactTable<any>;
}) {
  const firstValue = table
    .getPreFilteredRowModel()
    .flatRows[0]?.getValue(column.id);

  const columnFilterValue = column.getFilterValue();

  const sortedUniqueValues = useMemo(
    () =>
      typeof firstValue === "number"
        ? []
        : Array.from(column.getFacetedUniqueValues().keys()).sort(),
    [column.getFacetedUniqueValues()]
  );

  return (
    <>
      <datalist id={column.id + "list"}>
        {sortedUniqueValues.slice(0, 5000).map((value: any) => (
          <option value={value} key={value} />
        ))}
      </datalist>
      <TextInput
        type={typeof firstValue === "number" ? "numeric" : "text"}
        value={(columnFilterValue ?? "") as string}
        onChange={(event) => column.setFilterValue(event.target.value)}
        placeholder={`Search... (${column.getFacetedUniqueValues().size})`}
        list={column.id + "list"}
      />
    </>
  );
}
