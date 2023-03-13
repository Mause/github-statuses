import type { Request } from "@remix-run/node";
import { print } from "graphql";
import gql from "graphql-tag";
import type {
  GetActionsForPullRequestQuery,
  GetActionsForPullRequestQueryVariables,
} from "~/components/graphql/graphql";
import { getOctokit } from "~/octokit.server";

export const fragment = gql`
  fragment PullRequests on Repository {
    pullRequest(number: $prNumber) {
      title
      state
      permalink
      commits(first: 1) {
        nodes {
          commit {
            checkSuites {
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
                checkRuns {
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
    user(login: $owner) {
      repository(name: $repo) {
        ...PullRequests
      }
    }
    organization(login: $owner) {
      repository(name: $repo) {
        ...PullRequests
      }
    }
  }
`;

export async function getActions(
  request: Request,
  variables: Required<GetActionsForPullRequestQueryVariables>
) {
  const octokit = await getOctokit(request);
  const thing = await octokit.graphql<GetActionsForPullRequestQuery>(
    print(query),
    variables
  );

  const pr = (thing.organization || thing.user)?.repository![" $fragmentRefs"]
    ?.PullRequestsFragment;

  return pr?.pullRequest!;
}
