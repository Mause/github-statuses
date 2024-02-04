import { json } from "@remix-run/node";
import type { DataLoaderParams } from "~/components";
import {
  buildNameWithOwner,
  buildMergeableColumn,
  buildRollupColumn,
  buildTitleColumn,
  StandardTable,
} from "~/components";
import { call } from "~/octokit.server";
import gql from "graphql-tag";
import {
  type GetUserPullRequestsQueryVariables,
  GetUserPullRequestsDocument,
  IssueOrderField,
  OrderDirection,
} from "~/components/graphql/graphql";
import { Heading, Link as PrimerLink } from "@primer/react";
import type { StandardTableOptions } from "~/components/StandardTable";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";

export const Query = gql`
  query GetUserPullRequests($owner: String!, $order: IssueOrder!) {
    user(login: $owner) {
      login
      url
      pullRequests(first: 10, orderBy: $order, states: OPEN) {
        edges {
          node {
            url
            ...StatusCheckRollup
            ...PrDetails
          }
        }
      }
    }
  }
`;

export const loader = async ({
  params,
  request,
}: DataLoaderParams<"owner">) => {
  const variables: GetUserPullRequestsQueryVariables = {
    owner: params.owner!,
    order: {
      field: IssueOrderField.UpdatedAt,
      direction: OrderDirection.Desc,
    },
  };
  const { user } = await call(request, GetUserPullRequestsDocument, variables);
  return json({
    user,
    pulls: user!.pullRequests!.edges!.map((edge) => edge!.node!),
  });
};

export default function Owner() {
  const { user, pulls } = useLoaderDataReloading<typeof loader>();

  type PullRequest = (typeof pulls)[0];

  const table: StandardTableOptions<PullRequest> = {
    data: pulls,
    columns: [
      buildTitleColumn(),
      buildNameWithOwner<PullRequest>(),
      buildMergeableColumn<PullRequest>(),
      buildRollupColumn<PullRequest>(),
    ],
  };

  return (
    <>
      <Heading>
        <PrimerLink href={user!.url}>{user!.login}</PrimerLink>
      </Heading>
      <StandardTable tableOptions={table}>No pull requests found</StandardTable>
    </>
  );
}
