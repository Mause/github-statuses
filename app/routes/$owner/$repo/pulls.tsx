import { Header, Label } from "@primer/react";
import type { SerializeFrom } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import type { AccessorFnColumnDef, CellContext } from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import type { DataLoaderParams } from "~/components";
import { StandardTable, Wrapper } from "~/components";
import type { StandardTableOptions } from "~/components/StandardTable";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import { titleCase } from "./pull/titleCase";
import type { PullRequest } from "./pullsQuery";
import { getChecksStatus, getPullRequests } from "./pullsQuery";
import type { FragmentType } from "~/components/graphql/fragment-masking";
import { getFragment } from "~/components/graphql/fragment-masking";
import type {
  MergeableState,
  StatusCheckRollupFragment,
} from "~/components/graphql/graphql";
import { StatusCheckRollupFragmentDoc } from "~/components/graphql/graphql";
import type { DocumentTypeDecoration } from "@graphql-typed-document-node/core";
import type { LabelColorOptions } from "@primer/react/lib-esm/Label";

export const loader = async ({
  params,
  request,
}: DataLoaderParams<"repo" | "owner">) => {
  return json(
    await getPullRequests(request, {
      owner: params.owner!,
      repo: params.repo!,
    })
  );
};

const columnHelper = createColumnHelper<SerializeFrom<PullRequest>>();

export default function Pulls() {
  const { pulls, title, url } = useLoaderDataReloading<typeof loader>();

  const table: StandardTableOptions<SerializeFrom<PullRequest>> = {
    data: pulls,
    columns: [
      columnHelper.accessor("number", {
        header: "#",
        cell: (props) => `#${props.getValue()}`,
      }),
      columnHelper.accessor("title", {
        header: "Title",
        cell: (props) => (
          <Link to={new URL(props.row.original.permalink).pathname}>
            {props.getValue()}
          </Link>
        ),
      }),
      columnHelper.accessor("author.login", {
        header: "By",
        cell: (props) => (
          <a
            target="_blank"
            href={props.row.original.author?.url}
            rel="noreferrer"
          >
            {props.getValue()}
          </a>
        ),
      }),
      buildMergeableColumn(),
      buildRollupColumn(),
    ],
  };

  return (
    <Wrapper>
      <Header.Item>
        <Header.Link as={Link} to={url}>
          {title}
        </Header.Link>
      </Header.Item>
      <StandardTable tableOptions={table} />
    </Wrapper>
  );
}

export function buildMergeableColumn<
  T extends FragmentType<DocumentTypeDecoration<StatusCheckRollupFragment, any>>
>(): AccessorFnColumnDef<
  SerializeFrom<T>,
  StatusCheckRollupFragment["mergeable"]
> {
  return {
    accessorFn: (props: SerializeFrom<T>) =>
      getFragment(StatusCheckRollupFragmentDoc, props as T).mergeable,
    header: "Mergeability",
    cell: (props) => {
      const value: Record<MergeableState, LabelColorOptions> = {
        CONFLICTING: "attention",
        MERGEABLE: "success",
        UNKNOWN: "secondary",
      };

      return (
        <Label variant={value[props.getValue()]}>
          {titleCase(props.getValue())}
        </Label>
      );
    },
  };
}

export function buildRollupColumn<
  T extends FragmentType<DocumentTypeDecoration<StatusCheckRollupFragment, any>>
>(): AccessorFnColumnDef<
  SerializeFrom<T>,
  StatusCheckRollupFragment["statusCheckRollup"]
> {
  return {
    accessorFn: (props: SerializeFrom<T>) =>
      getFragment(StatusCheckRollupFragmentDoc, props as T).statusCheckRollup,
    header: "Rollup",
    cell: (props) => {
      const statusCheckRollup = props.getValue();

      let rollup = getChecksStatus(statusCheckRollup);

      return Object.entries(rollup)
        .filter(([_, v]) => v !== 0)
        .map(([k, v]) => `${v} ${k}`)
        .join(", ");
    },
  };
}
