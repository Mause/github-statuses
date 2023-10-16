import { createColumnHelper } from "@tanstack/react-table";
import _ from "lodash";
import { StandardTable, Wrapper } from "~/components";

type Item = { hello: string };
const columnHelper = createColumnHelper<Item>();

export default function Test() {
  const tableOptions = {
    data: [
      {
        hello: _.repeat("world", 20),
      },
    ],
    columns: [columnHelper.accessor("hello", { header: "Hello" })],
  };

  return <StandardTable tableOptions={tableOptions}>No data</StandardTable>;
}
