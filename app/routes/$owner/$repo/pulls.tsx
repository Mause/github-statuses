import { Link as PrimerLink } from "@primer/react";
import type { SerializeFrom } from "@remix-run/node";
import { json } from "@remix-run/node";
import { createColumnHelper } from "@tanstack/react-table";
import type { DataLoaderParams } from "~/components";
import {
  StandardTable,
  buildMergeableColumn,
  buildNumberColumn,
  buildRollupColumn,
  buildTitleColumn,
} from "~/components";
import type { StandardTableOptions } from "~/components/StandardTable";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";

import type { Requests } from "~/octokit.server";
import { call as call$ } from "~/octokit.server";
import type {
  PullRequestStatusQuery,
  PullRequestStatusQueryVariables,
} from "~/components/graphql/graphql";
import { PullRequestStatusDocument } from "~/components/graphql/graphql";
import type { Get } from "type-fest";
import { serverOnly$ } from "vite-env-only/macros";

import gql from "graphql-tag";

const call = serverOnly$(call$);

export const query = gql`
  fragment PrDetails on PullRequest {
    title
    number
    repository {
      nameWithOwner
    }
    mergeable
    mergeStateStatus
  }

  fragment StatusCheckRollup on PullRequest {
    statusCheckRollup: commits(last: 1) {
      nodes {
        commit {
          statusCheckRollup {
            contexts(first: 100) {
              nodes {
                __typename
                ... on StatusContext {
                  state
                }
                ... on CheckRun {
                  name
                  checkSuite {
                    workflowRun {
                      workflow {
                        name
                      }
                    }
                  }
                  status
                  conclusion
                  startedAt
                  completedAt
                  detailsUrl
                }
              }
            }
          }
        }
      }
    }
  }

  query PullRequestStatus(
    $owner: String!
    $repo: String!
    $per_page: Int = 100
  ) {
    repository(owner: $owner, name: $repo) {
      name
      url
      parent {
        name
      }
      pullRequests(
        first: $per_page
        orderBy: { field: CREATED_AT, direction: DESC }
        states: OPEN
      ) {
        totalCount
        edges {
          node {
            url
            isDraft
            isCrossRepository
            headRefName
            resourcePath
            ...PrDetails
            author {
              login
              url
            }
            headRepositoryOwner {
              id
              login
              ... on User {
                name
              }
            }
            ...StatusCheckRollup
          }
        }
      }
    }
  }
`;

export type PullRequest = Get<
  PullRequestStatusQuery,
  "repository.pullRequests.edges.0.node"
> & {};

export async function getPullRequests(
  request: Requests,
  variables: PullRequestStatusQueryVariables,
) {
  const resp = await call!(request, PullRequestStatusDocument, variables);

  const repo = resp.repository!;
  return {
    title: repo.name,
    url: repo.url,
    isFork: !!repo.parent,
    pulls: repo.pullRequests!.edges!.map((edge) => edge!.node!),
  };
}

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
        cell: (cell) => (
          <PrimerLink
            target="_blank"
            href={cell.row.original.author?.url}
            rel="noreferrer"
          >
            {cell.getValue()}
          </PrimerLink>
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
