import { getOctokit } from "~/octokit.server";
import type {
  PullRequestStatusQuery,
  PullRequestStatusQueryVariables,
} from "~/components/graphql/graphql";
import type { Get } from "type-fest";
import { print } from "graphql";

import gql from "graphql-tag";
import type { Request } from "@remix-run/node";

export const query = gql`
  query PullRequestStatus(
    $owner: String!
    $repo: String!
    $per_page: Int = 100
  ) {
    repository(owner: $owner, name: $repo) {
      pullRequests(
        first: $per_page
        orderBy: { field: CREATED_AT, direction: DESC }
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
            permalink
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
            statusCheckRollup: commits(last: 1) {
              nodes {
                commit {
                  statusCheckRollup {
                    contexts(first: 100) {
                      nodes {
                        __typename
                        ... on StatusContext {
                          context
                          state
                          targetUrl
                          createdAt
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
                      pageInfo {
                        hasNextPage
                        endCursor
                      }
                    }
                  }
                }
              }
            }
            mergeable
          }
        }
      }
    }
  }
`;

type PullRequest = Get<
  PullRequestStatusQuery,
  "repository.pullRequests.edges.0.node"
> & {};
export type PRWithRollup = PullRequest & {
  rollup: PullRequestChecksStatus;
};

export async function getPullRequests(
  request: Request,
  variables: PullRequestStatusQueryVariables
) {
  const octokit = await getOctokit(request);
  const resp = await octokit.graphql<PullRequestStatusQuery>(
    print(query),
    variables
  );

  return resp
    .repository!.pullRequests!.edges!.map((edge) => edge!.node!)
    .map((pr): PRWithRollup => {
      let rpr = pr as PRWithRollup;
      rpr.rollup = ChecksStatus(rpr!.statusCheckRollup!);
      return rpr;
    });
}

interface PullRequestChecksStatus {
  pending: number;
  failing: number;
  passing: number;
  total: number;
}

function ChecksStatus(
  pr: PullRequest["statusCheckRollup"]
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
  let commit = nodes[0]!.commit;
  for (const c of commit!.statusCheckRollup!.contexts!.nodes!) {
    if (!(c?.__typename === "CheckRun")) continue;

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
