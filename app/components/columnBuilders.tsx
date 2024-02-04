import type { SerializeFrom } from "@remix-run/node";
import { Link } from "@remix-run/react";
import type { AccessorFnColumnDef } from "@tanstack/react-table";
import type { PrDetailsFragment } from "~/components/graphql/graphql";
import { PrDetailsFragmentDoc } from "~/components/graphql/graphql";
import { Link as PrimerLink } from "@primer/react";
import type { FragmentType } from "~/components/graphql";
import { getFragment } from "~/components/graphql";
import type { DocumentTypeDecoration } from "@graphql-typed-document-node/core";

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
