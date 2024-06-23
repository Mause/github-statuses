import { call } from "~//octokit.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import graphql from "graphql-tag";
import { GetIssuesAndPullRequestsDocument } from "~/components/graphql/graphql";

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

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const octokit = await call(request, GetIssuesAndPullRequestsDocument);

  return {
    issues: octokit.repository!.issues!.nodes!,
    pullRequests: octokit.repository!.pullRequests!.nodes!,
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
