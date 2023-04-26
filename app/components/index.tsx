import type { Params } from "@remix-run/react";
import type { Request } from "@remix-run/node";

export { default as StandardTable } from "./StandardTable";
export type { StandardTableOptions } from "./StandardTable";
export { default as Wrapper } from "./Wrapper";
export { Markdown } from "./Markdown";
export { dedentBlock, dedent } from "./dedentBlock";
export { titleCase } from "./titleCase";

export interface DataLoaderParams<T extends string> {
  params: Params<T>;
  request: Request;
}
