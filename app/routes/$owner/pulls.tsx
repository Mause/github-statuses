import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import type { DataLoaderParams } from "~/components";
import { StandardTable, Wrapper } from "~/components";
import { call, getOctokit } from "~/octokit.server";
import gql from "graphql-tag";
import type { GetUserPullRequestsQueryVariables } from "~/components/graphql/graphql";
import { GetUserPullRequestsDocument } from "~/components/graphql/graphql";
import { IssueOrderField, OrderDirection } from "~/components/graphql/graphql";
import { Header } from "@primer/react";
import type { StandardTableOptions } from "~/components/StandardTable";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import { buildMergeableColumn, buildRollupColumn } from "./$repo/pulls";

export const Query = gql`
  query GetUserPullRequests($owner: String!, $order: IssueOrder!) {
    user(login: $owner) {
      login
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
  const octokit = await getOctokit(request);
  const { user } = await call(octokit, GetUserPullRequestsDocument, variables);
  return json({
    login: user!.login!,
    pulls: user!.pullRequests!.edges!.map((edge) => edge!.node!),
  });
};

export default function Owner() {
  const { login, pulls } = useLoaderDataReloading<typeof loader>();

  type PullRequest = (typeof pulls)[0];

  const columnHelper = createColumnHelper<PullRequest>();
  const table: StandardTableOptions<PullRequest> = {
    data: pulls,
    columns: [
      columnHelper.accessor("title", {
        header: "Title",
        cell: (props) => {
          const { number, repository } = props.row.original!;
          return (
            <Link to={`/${repository.nameWithOwner}/pull/${number}`}>
              {props.renderValue()}
            </Link>
          );
        },
      }),
      columnHelper.accessor("repository.nameWithOwner", {
        header: "Repository",
        cell: (props) => {
          const name = props.getValue();
          return <Link to={`/${name}/pulls`}>{name}</Link>;
        },
      }),
      buildMergeableColumn(),
      buildRollupColumn(),
    ],
  };

  return (
    <Wrapper>
      <Header.Item>{login}</Header.Item>
      <StandardTable tableOptions={table}>No pull requests found</StandardTable>
    </Wrapper>
  );
}
