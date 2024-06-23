import { call } from "~//octokit.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import graphql from "graphql-tag";
import {
  GetIssuesAndPullRequestsDocument,
  GetOverviewThingsFragmentDoc,
} from "~/components/graphql/graphql";
import { Wrapper } from "~/components";
import { getFragment } from "~/components/graphql";
import { DataTable } from "@primer/react/drafts";
import { Link, Octicon } from "@primer/react";
import { GitPullRequestIcon, IssueOpenedIcon } from "@primer/octicons-react";

export const GetIssuesAndPullRequests = graphql`
  fragment GetOverviewThings on Repository {
    issues(states: [OPEN], first: 10) {
      nodes {
        __typename
        id
        number
        title
        url
        repository {
          nameWithOwner
        }
      }
    }
    pullRequests(states: [OPEN], first: 10) {
      nodes {
        __typename
        id
        number
        title
        url
        repository {
          nameWithOwner
        }
      }
    }
  }

  query GetIssuesAndPullRequests {
    java: repository(owner: "duckdb", name: "duckdb-java") {
      ...GetOverviewThings
    }
    nodejs: repository(owner: "duckdb", name: "duckdb-node") {
      ...GetOverviewThings
    }
    rust: repository(owner: "duckdb", name: "duckdb-rs") {
      ...GetOverviewThings
    }
    engine: repository(owner: "Mause", name: "duckdb-engine") {
      ...GetOverviewThings
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const octokit = await call(request, GetIssuesAndPullRequestsDocument);

  const items = [];
  for (const value of Object.values(octokit)) {
    if (typeof value !== "string") {
      const res = getFragment(GetOverviewThingsFragmentDoc, value);
      items.push(...res!.issues!.nodes!.map((issue) => convert(issue!)));
      items.push(...res!.pullRequests!.nodes!.map((pr) => convert(pr!)));
    }
  }

  return { items };
};

export function Overview({ items }: { items: IssueOrPullRequest[] }) {
  return (
    <DataTable
      data={items}
      columns={[
        {
          id: "__typename",
          header: "__typename",
          renderCell({ __typename }) {
            if (__typename == "Issue") {
              return <Octicon icon={IssueOpenedIcon} />;
            } else {
              return <Octicon icon={GitPullRequestIcon} />;
            }
          },
        },
        {
          id: "number",
          header: "ID",
          field: "number",
        },
        {
          id: "title",
          header: "Title",
          field: "title",
        },
        {
          id: "url",
          header: "URL",
          renderCell(data) {
            return (
              <Link target="_blank" href={data.url}>
                {data.repository.nameWithOwner}#{data.number}
              </Link>
            );
          },
        },
      ]}
    ></DataTable>
  );
}

export interface IssueOrPullRequest {
  __typename: "Issue" | "PullRequest";
  id: string;
  title: string;
  url: string;
  number: number;
  repository: {
    nameWithOwner: string;
  };
}

function convert(item: IssueOrPullRequest): IssueOrPullRequest {
  return {
    __typename: item.__typename!,
    number: item.number,
    repository: {
      nameWithOwner: item.repository.nameWithOwner,
    },
    id: item.id,
    title: item.title,
    url: item.url,
  };
}

export default () => {
  const { items } = useLoaderData<typeof loader>();

  return (
    <Wrapper>
      <></>
      <Overview items={items} />
    </Wrapper>
  );
};
