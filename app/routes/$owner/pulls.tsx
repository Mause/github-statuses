import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import type { DataLoaderParams } from "~/components";
import { StandardTable } from "~/components";
import { call } from "~/octokit.server";
import gql from "graphql-tag";
import type { GetUserPullRequestsQueryVariables } from "~/components/graphql/graphql";
import { GetUserPullRequestsDocument , IssueOrderField, OrderDirection } from "~/components/graphql/graphql";
import { Heading, Link as PrimerLink } from "@primer/react";
import type { StandardTableOptions } from "~/components/StandardTable";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import {
  buildMergeableColumn,
  buildRollupColumn,
  buildTitleColumn,
} from "./$repo/pulls";

export const Query = gql`
  query GetUserPullRequests($owner: String!, $order: IssueOrder!) {
    user(login: $owner) {
      login
      url
      pullRequests(first: 10, orderBy: $order, states: OPEN) {
        edges {
          node {
            number
            title
            url
            repository {
              nameWithOwner
            }
            ...StatusCheckRollup
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

  const columnHelper = createColumnHelper<PullRequest>();
  const table: StandardTableOptions<PullRequest> = {
    data: pulls,
    columns: [
      buildTitleColumn(),
      columnHelper.accessor("repository.nameWithOwner", {
        header: "Repository",
        cell: (props) => {
          const name = props.getValue();
          return (
            <PrimerLink as={Link} to={`/${name}/pulls`}>
              {name}
            </PrimerLink>
          );
        },
      }),
      buildMergeableColumn<PullRequest>(),
      buildRollupColumn<PullRequest>(),
    ],
  };

  return (
    <>
      <Heading>
        <Link to={user!.url}>{user!.login}</Link>
      </Heading>
      <StandardTable tableOptions={table}>No pull requests found</StandardTable>
    </>
  );
}
