import { call } from "~/octokit.server";
import type {
  PullRequestStatusQuery,
  PullRequestStatusQueryVariables,
  StatusCheckRollupFragment,
} from "~/components/graphql/graphql";
import { PullRequestStatusDocument } from "~/components/graphql/graphql";
import type { Get } from "type-fest";

import gql from "graphql-tag";
import type { Request } from "@remix-run/node";

export const query = gql`
  fragment StatusCheckRollup on PullRequest {
    mergeable
    mergeStateStatus
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
            number
            title
            state
            url
            isDraft
            isCrossRepository
            headRefName
            resourcePath
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
            mergeStateStatus
            ...StatusCheckRollup
            mergeable
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

export type WithRollup<T> = T & {
  rollup: PullRequestChecksStatus;
};
export type PRWithRollup = WithRollup<PullRequest>;

export async function getPullRequests(
  request: Request,
  variables: PullRequestStatusQueryVariables,
) {
  const resp = await call(request, PullRequestStatusDocument, variables);

  const repo = resp.repository!;
  return {
    title: repo.name,
    url: repo.url,
    isFork: !!repo.parent,
    pulls: repo.pullRequests!.edges!.map((edge) => edge!.node!),
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
