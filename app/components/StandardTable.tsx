import type {
  Column,
  ColumnFiltersState,
  SortingState,
  TableOptions,
  ColumnDef,
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
  flexRender,
} from "@tanstack/react-table";
import { SearchIcon } from "@primer/octicons-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { fuzzyFilter } from "./fuzzyFilter";
import { TextInput } from "@primer/react";
import { Table } from "@primer/react/experimental";
import { TableSortHeader } from "@primer/react/lib-esm/DataTable/Table";
import { getGridTemplateFromColumns } from "@primer/react/lib-esm/DataTable/useTable";
import type { SortDirection as TableSortDirection } from "@primer/react/lib-esm/DataTable/sorting";
import { captureMessage } from "@sentry/remix";

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

function convertColumn(source: ColumnDef<any>) {
  return { header: source.header as string };
}

export default function StandardTable<T>({
  tableOptions,
  children,
}: {
  tableOptions: StandardTableOptions<T>;
  children: ReactNode[] | ReactNode;
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

  const gridTemplateColumns = getGridTemplateFromColumns(
    tableOptions.columns.map((column) => convertColumn(column)),
  ).join(" ");

  if (tableOptions.data == null) {
    captureMessage("`data` was non-truthy", { level: "warning" });
  }

  if (!tableOptions.data?.length) {
    return <>{children}</>;
  }

  return (
    <Table.Container>
      <Table.Actions>
        <TextInput
          onChange={(event) => setGlobalFilter(event.target.value)}
          leadingVisual={() => <SearchIcon />}
        />
      </Table.Actions>
      <Table
        style={{ overflowX: "auto", display: "block", whiteSpace: "nowrap" }}
        gridTemplateColumns={gridTemplateColumns}
      >
        <Table.Head>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Row key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const shared = {
                  key: header.id,
                  colSpan: header.colSpan,
                };
                const [content, filt] = [
                  flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  ),
                  header.column.getCanFilter() && (
                    <Filter column={header.column} table={table} />
                  ),
                ];
                if (header.column.getCanSort()) {
                  return (
                    <TableSortHeader
                      {...shared}
                      direction={mapSortDirection(header.column.getIsSorted())}
                      onToggleSort={getSortOnClick(header)}
                    >
                      {content}
                      {filt}
                    </TableSortHeader>
                  );
                } else {
                  return (
                    <Table.Header {...shared}>
                      {content}
                      {filt}
                    </Table.Header>
                  );
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
                  header.getContext(),
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
    [column.getFacetedUniqueValues()],
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
