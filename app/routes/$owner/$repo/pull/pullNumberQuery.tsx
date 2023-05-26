import type { Request } from "@remix-run/node";
import gql from "graphql-tag";
import { getFragment } from "~/components/graphql";
import type {
  GetActionsForPullRequestQueryVariables,
  PullRequestsFragment,
} from "~/components/graphql/graphql";
import { GetActionsForPullRequestDocument } from "~/components/graphql/graphql";
import { PullRequestsFragmentDoc } from "~/components/graphql/graphql";
import { call, getOctokit } from "~/octokit.server";

export const fragment = gql`
  fragment PullRequests on Repository {
    pullRequest(number: $prNumber) {
      title
      state
      permalink
      commits(last: 1) {
        nodes {
          commit {
            checkSuites(first: 100) {
              nodes {
                app {
                  name
                }
                workflowRun {
                  workflow {
                    name
                  }
                }
                conclusion
                checkRuns(first: 100) {
                  nodes {
                    name
                    conclusion
                    startedAt
                    completedAt
                    permalink
                    status
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

export const query = gql`
  query GetActionsForPullRequest(
    $owner: String!
    $repo: String!
    $prNumber: Int!
  ) {
    repositoryOwner(login: $owner) {
      repository(name: $repo) {
        ...PullRequests
      }
    }
  }
`;

export async function getActions(
  request: Request,
  variables: Required<GetActionsForPullRequestQueryVariables>
): Promise<NonNullable<PullRequestsFragment["pullRequest"]>> {
  const thing = await call(
    request,
    GetActionsForPullRequestDocument,
    variables
  );

  return getFragment(
    PullRequestsFragmentDoc,
    thing.repositoryOwner?.repository
  )!.pullRequest!;
}
