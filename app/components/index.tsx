import type { Params } from "@remix-run/react";

export {
  default as StandardTable,
  type StandardTableOptions,
} from "./StandardTable";
export { default as Wrapper } from "./Wrapper";
export { Markdown } from "./Markdown";
export { dedentBlock, dedent } from "./dedentBlock";
export { titleCase } from "./titleCase";
export { ErrorBoundary, splatObject } from "./ErrorBoundary";
export { ActionProgress } from "./ActionProgress";
export { ExternalLink } from "./ExternalLink";
export { TabNavLink } from "./TabNavLink";
export { DefaultMessage } from "./DefaultMessage";
export { catchError } from "./errors";

export interface DataLoaderParams<T extends string> {
  params: Params<T>;
  request: Request;
}
