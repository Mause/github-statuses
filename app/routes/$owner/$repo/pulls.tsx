import { Label, Link as PrimerLink } from "@primer/react";
import type { SerializeFrom } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import type { AccessorFnColumnDef } from "@tanstack/react-table";
import { createColumnHelper } from "@tanstack/react-table";
import type { DataLoaderParams } from "~/components";
import { StandardTable } from "~/components";
import type { StandardTableOptions } from "~/components/StandardTable";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import { titleCase } from "~/components/titleCase";
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
import type { LabelColorOptions } from "@primer/react/lib/Label";

export const loader = async ({
  params,
  request,
}: DataLoaderParams<"repo" | "owner">) => {
  return json(
    await getPullRequests(request, {
      owner: params.owner!,
      repo: params.repo!,
    }),
  );
};

const columnHelper = createColumnHelper<SerializeFrom<PullRequest>>();

export default function Pulls() {
  const { pulls } = useLoaderDataReloading<typeof loader>();

  const table: StandardTableOptions<SerializeFrom<PullRequest>> = {
    data: pulls,
    columns: [
      buildNumberColumn(),
      buildTitleColumn(),
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
      buildMergeableColumn<PullRequest>(),
      buildRollupColumn<PullRequest>(),
    ],
  };

  return (
    <StandardTable tableOptions={table}>No pull requests found</StandardTable>
  );
}

export function buildNumberColumn<
  T extends FragmentType<
    DocumentTypeDecoration<StatusCheckRollupFragment, any>
  >,
>(): AccessorFnColumnDef<SerializeFrom<T>, number> {
  return {
    accessorFn: (props: SerializeFrom<T>) =>
      getFragment(StatusCheckRollupFragmentDoc, props as T).number,
    header: "#",
    cell: (props) => `#${props.getValue()}`,
  };
}

export function buildTitleColumn<
  T extends FragmentType<
    DocumentTypeDecoration<StatusCheckRollupFragment, any>
  >,
>(): AccessorFnColumnDef<SerializeFrom<T>, string> {
  return {
    accessorFn: (props: SerializeFrom<T>) =>
      getFragment(StatusCheckRollupFragmentDoc, props as T).title,
    header: "Title",
    cell: (props) => {
      const { number, repository } = getFragment(
        StatusCheckRollupFragmentDoc,
        props.row.original! as T,
      );
      return (
        <PrimerLink
          as={Link}
          to={`/${repository.nameWithOwner}/pull/${number}`}
        >
          {props.renderValue()}
        </PrimerLink>
      );
    },
  };
}

export function buildMergeableColumn<
  T extends FragmentType<
    DocumentTypeDecoration<StatusCheckRollupFragment, any>
  >,
>(): AccessorFnColumnDef<
  SerializeFrom<T>,
  StatusCheckRollupFragment["mergeable"]
> {
  return {
    accessorFn: (props: SerializeFrom<T>) =>
      getFragment(StatusCheckRollupFragmentDoc, props as T).mergeable,
    header: "Mergeability",
    cell: (props) => {
      const value: { [key in MergeableState]: LabelColorOptions } = {
        CONFLICTING: "attention",
        MERGEABLE: "success",
        UNKNOWN: "secondary",
      };

      const gotValue = props.getValue();
      return <Label variant={value[gotValue]}>{titleCase(gotValue)}</Label>;
    },
  };
}

export function buildRollupColumn<
  T extends FragmentType<
    DocumentTypeDecoration<StatusCheckRollupFragment, any>
  >,
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
