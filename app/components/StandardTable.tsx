import type {
  Column,
  ColumnFiltersState,
  SortingState,
  TableOptions,
  Table as ReactTable,
  SortDirection,
  Header,
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
import { SearchIcon } from "@primer/octicons-react";
import { useMemo, useState } from "react";
import { fuzzyFilter } from "./fuzzyFilter";
import { TextInput } from "@primer/react";
import { Table } from "@primer/react/drafts";
import { TableSortHeader } from "@primer/react/lib-esm/DataTable/Table";
import type { SortDirection as TableSortDirection } from "@primer/react/lib-esm/DataTable/sorting";

export type StandardTableOptions<T> = Pick<TableOptions<T>, "data" | "columns">;

function mapSortDirection(sort: boolean | SortDirection): TableSortDirection {
  switch (sort) {
    case "asc":
    case true:
      return "ASC";
    case "desc":
      return "DESC";
    case false:
      return "NONE";
  }
}

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
    <Table.Container>
      <Table.Actions>
        <TextInput
          onChange={(event) => setGlobalFilter(event.target.value)}
          leadingVisual={SearchIcon}
        />
      </Table.Actions>
      <Table style={{ overflowX: "auto", display: "block", whiteSpace: "nowrap" }}>
        <Table.Head>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const shared = {
                  key: header.id,
                  colSpan: header.colSpan,
                  children: [
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    ),
                    header.column.getCanFilter() && (
                      <Filter column={header.column} table={table} />
                    ),
                  ],
                };
                if (header.column.getCanSort()) {
                  return (
                    <TableSortHeader
                      {...shared}
                      direction={mapSortDirection(header.column.getIsSorted())}
                      onToggleSort={getSortOnClick(header)}
                    />
                  );
                } else {
                  return <Table.Header {...shared} />;
                }
              })}
            </Table.Row>
          ))}
        </Table.Head>
        <Table.Body>
          {table.getRowModel().rows.map((row) => (
            <Table.Row key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <Table.Cell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </Table.Cell>
              ))}
            </Table.Row>
          ))}
        </Table.Body>

        <tfoot>
          {table.getFooterGroups().map((footerGroup) => (
            <Table.Row key={footerGroup.id}>
              {footerGroup.headers.map((header) => {
                const value = flexRender(
                  header.column.columnDef.footer,
                  header.getContext()
                );
                const shared = { key: header.id, colSpan: header.colSpan };
                return header.isPlaceholder || !value ? (
                  <th {...shared}></th>
                ) : (
                  <Table.Header {...shared}>{value}</Table.Header>
                );
              })}
            </Table.Row>
          ))}
        </tfoot>
      </Table>
    </Table.Container>
  );
}

function getSortOnClick(header: Header<any, unknown>): () => void {
  const handler = header.column.getToggleSortingHandler();
  return () => {
    if (handler) handler({});
  };
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
        : Array.from(column.getFacetedUniqueValues().keys())
            .sort()
            .filter((x) => x),
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
