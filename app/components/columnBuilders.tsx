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
interface PullRequestChecksStatus {
  pending: number;
  failing: number;
  passing: number;
  total: number;
}

export function getChecksStatus(
  pr: StatusCheckRollupFragment["statusCheckRollup"],
): PullRequestChecksStatus {
  const summary: PullRequestChecksStatus = {
    failing: 0,
    passing: 0,
    pending: 0,
    total: 0,
  };

  const nodes = pr!.nodes!;

  if (nodes.length == 0) {
    return summary;
  }
  let { commit } = nodes[0]!;
  if (!commit?.statusCheckRollup) {
    return summary;
  }
  for (const c of commit!.statusCheckRollup!.contexts!.nodes!) {
    if (!(c?.__typename === "CheckRun")) {
      continue;
    }

    let state;
    // CheckRun
    if (c!.status! == "COMPLETED") {
      state = c!.conclusion!;
    } else {
      state = c!.status!;
    }
    switch (state) {
      case "SUCCESS":
      case "NEUTRAL":
      case "SKIPPED":
        summary.passing++;
        break;
      // case "ERROR":
      case "FAILURE":
      case "CANCELLED":
      case "TIMED_OUT":
      case "ACTION_REQUIRED":
        summary.failing++;
        break;
      default: // "EXPECTED", "REQUESTED", "WAITING", "QUEUED", "PENDING", "IN_PROGRESS", "STALE"
        summary.pending++;
    }
    summary.total++;
  }

  return summary;
}
