import { call } from "~//octokit.server";
import type { LoaderFunction } from "remix";
import { useLoaderData } from "@remix-run/react";
import graphql from "graphql-tag";
import { GetIssuesAndPullRequestsQuery } from "~/components/graphql";

export const GetIssuesAndPullRequests = graphql`
  query GetIssuesAndPullRequests {
    repository(owner: "octokit", name: "rest.js") {
      issues(states: [OPEN], first: 10) {
        nodes {
          title
          url
        }
      }
      pullRequests(states: [OPEN], first: 10) {
        nodes {
          title
          url
        }
      }
    }
  }
`;

export const loader: LoaderFunction = async ({ request }) => {
  const octokit = await call(request, GetIssuesAndPullRequestsQuery);

  return {
    issues: octokit.issues,
    pullRequests: octokit.pullRequests,
  };
};

export default function Overview() {
  const { issues, pullRequests } = useLoaderData<typeof loader>();
  return (
    <p>
      {pullRequests.length} pull requests and {issues.length} issues
    </p>
  );
}
