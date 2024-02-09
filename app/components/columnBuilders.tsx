import type { SerializeFrom } from "@remix-run/node";
import { Link } from "@remix-run/react";
import type { AccessorFnColumnDef } from "@tanstack/react-table";
import type {
  MergeableState,
  PrDetailsFragment,
  StatusCheckRollupFragment,
} from "~/components/graphql/graphql";
import {
  PrDetailsFragmentDoc,
  StatusCheckRollupFragmentDoc,
} from "~/components/graphql/graphql";
import { Label, Link as PrimerLink } from "@primer/react";
import { getFragment, type FragmentType } from "~/components/graphql";
import type { DocumentTypeDecoration } from "@graphql-typed-document-node/core";
import { getChecksStatus } from "~/routes/$owner/$repo/pullsQuery";
import { titleCase } from "./titleCase";
type LabelColorOptions = Parameters<typeof Label>[0]["variant"];

export function buildNameWithOwner<
  T extends FragmentType<DocumentTypeDecoration<PrDetailsFragment, any>>,
>(): AccessorFnColumnDef<
  SerializeFrom<T>,
  PrDetailsFragment["repository"]["nameWithOwner"]
> {
  return {
    header: "Repository",
    accessorFn: (props: SerializeFrom<T>) =>
      getFragment(PrDetailsFragmentDoc, props as T).repository.nameWithOwner,
    cell: (props) => {
      const name = props.getValue();
      return (
        <PrimerLink as={Link} to={`/${name}/pulls`}>
          {name}
        </PrimerLink>
      );
    },
  };
}

export function buildNumberColumn<
  T extends FragmentType<DocumentTypeDecoration<PrDetailsFragment, any>>,
>(): AccessorFnColumnDef<SerializeFrom<T>, number> {
  return {
    accessorFn: (props: SerializeFrom<T>) =>
      getFragment(PrDetailsFragmentDoc, props as T).number,
    header: "#",
    cell: (props) => `#${props.getValue()}`,
  };
}

export function buildTitleColumn<
  T extends FragmentType<DocumentTypeDecoration<PrDetailsFragment, any>>,
>(): AccessorFnColumnDef<SerializeFrom<T>, string> {
  return {
    accessorFn: (props: SerializeFrom<T>) =>
      getFragment(PrDetailsFragmentDoc, props as T).title,
    header: "Title",
    cell: (props) => {
      const { number, repository } = getFragment(
        PrDetailsFragmentDoc,
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
  T extends FragmentType<DocumentTypeDecoration<PrDetailsFragment, any>>,
>(): AccessorFnColumnDef<SerializeFrom<T>, PrDetailsFragment["mergeable"]> {
  return {
    accessorFn: (props: SerializeFrom<T>) =>
      getFragment(PrDetailsFragmentDoc, props as T).mergeable,
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
