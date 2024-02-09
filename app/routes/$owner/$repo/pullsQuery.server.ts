import type { Requests } from "~/octokit.server";
import { call } from "~/octokit.server";
import type {
  PullRequestStatusQuery,
  PullRequestStatusQueryVariables,
} from "~/components/graphql/graphql";
import { PullRequestStatusDocument } from "~/components/graphql/graphql";
import type { Get } from "type-fest";

import gql from "graphql-tag";

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
  const resp = await call(request, PullRequestStatusDocument, variables);

  const repo = resp.repository!;
  return {
    title: repo.name,
    url: repo.url,
    isFork: !!repo.parent,
    pulls: repo.pullRequests!.edges!.map((edge) => edge!.node!),
  };
}
