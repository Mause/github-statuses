import type { Params } from "@remix-run/react";

export { default as StandardTable } from "./StandardTable";
export { default as Wrapper } from "./Wrapper";

export interface DataLoaderParams<T extends string> {
  params: Params<T>;
  request: Request;
}
