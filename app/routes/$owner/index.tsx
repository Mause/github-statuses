import { json } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import type { DataLoaderParams } from "~/components";
import { StandardTable, Wrapper } from "~/components";
import { getOctokit } from "~/octokit.server";
import gql from "graphql-tag";
import { print } from "graphql";
import type {
  GetUserPullRequestsQuery,
  GetUserPullRequestsQueryVariables,
} from "~/components/graphql/graphql";
import { IssueOrderField, OrderDirection } from "~/components/graphql/graphql";
import type { Get } from "type-fest";
import { Header } from "@primer/react";
import type { StandardTableOptions } from "~/components/StandardTable";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";

const Query = gql`
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
              name
              owner {
                ... on Organization {
                  login
                }
                ... on User {
                  login
                }
              }
            }
            commits(first: 1) {
              edges {
                node {
                  commit {
                    statusCheckRollup {
                      state
                      contexts(first: 1) {
                        checkRunCount
                      }
                    }
                  }
                }
              }
            }
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
  const res = await (
    await getOctokit(request)
  ).graphql<GetUserPullRequestsQuery>({
    query: print(Query),
    ...variables,
  });
  return json({ res });
};

export default function Owner() {
  const { res } = useLoaderDataReloading<typeof loader>();

  type PullRequest = Get<typeof res, "user.pullRequests.edges.0.node">;

  const columnHelper = createColumnHelper<PullRequest>();
  const table: StandardTableOptions<PullRequest> = {
    data: res!.user!.pullRequests!.edges!.map((edge) => edge!.node),
    columns: [
      columnHelper.accessor("title", {
        header: "Title",
        cell: (props) => {
          const { number, repository } = props.row.original!;
          return (
            <Link
              to={`/${repository.owner!.login!}/${
                repository.name
              }/pull/${number}`}
            >
              {props.renderValue()}
            </Link>
          );
        },
      }),
      columnHelper.accessor("repository", {
        header: "Repository",
        cell: (props) => {
          const value = props.getValue();
          const name = `${value.owner.login}/${value.name}`;
          return <Link to={`/${name}/pulls`}>{name}</Link>;
        },
      }),
    ],
  };

  return (
    <Wrapper>
      <Header.Item>{res.user!.login}</Header.Item>
      <StandardTable tableOptions={table} />
    </Wrapper>
  );
}
