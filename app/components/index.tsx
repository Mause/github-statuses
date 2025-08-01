import type { Params } from "@remix-run/react";

export {
  default as StandardTable,
  type StandardTableOptions,
} from "./StandardTable";
export { default as Wrapper } from "./Wrapper";
export { titleCase } from "./titleCase";
export { ErrorBoundary, splatObject } from "./ErrorBoundary";
export { ActionProgress } from "./ActionProgress";
export { ExternalLink } from "./ExternalLink";
export { TabNavLink } from "./TabNavLink";
export { DefaultMessage } from "./DefaultMessage";
export { catchError } from "./errors";
export {
  buildNameWithOwner,
  buildMergeableColumn,
  buildNumberColumn,
  buildRollupColumn,
  buildTitleColumn,
} from "./columnBuilders";

export interface DataLoaderParams<T extends string> {
  params: Params<T>;
  request: Request;
}
