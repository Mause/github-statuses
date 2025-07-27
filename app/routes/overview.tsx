import { call } from "~//octokit.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import graphql from "graphql-tag";
import {
  GetIssuesAndPullRequestsDocument,
  GetOverviewThingsFragmentDoc,
  IssueOrderField,
  IssueOverviewFragmentDoc,
  OrderDirection,
} from "~/components/graphql/graphql";
import { Wrapper } from "~/components";
import { getFragment } from "~/components/graphql";
import { DataTable } from "@primer/react/drafts";
import { Link, Octicon, RelativeTime } from "@primer/react";
import { GitPullRequestIcon, IssueOpenedIcon } from "@primer/octicons-react";
import _ from "lodash";

export const GetIssuesAndPullRequests = graphql`
  fragment IssueOverview on Issue {
    __typename
    id
    number
    title
    url
    updatedAt
    repository {
      nameWithOwner
      url
    }
  }
  fragment GetOverviewThings on Repository {
    issues(states: [OPEN], first: 10, orderBy: $order) {
      nodes {
        ...IssueOverview
      }
    }
    pullRequests(states: [OPEN], first: 10, orderBy: $order) {
      nodes {
        __typename
        id
        number
        title
        url
        updatedAt
        repository {
          nameWithOwner
          url
        }
      }
    }
  }

  query GetIssuesAndPullRequests($searchQuery: String!, $order: IssueOrder!) {
    search(first: 100, type: ISSUE, query: $searchQuery) {
      __typename
      issueCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          __typename
          ...IssueOverview
        }
      }
    }
    java: repository(owner: "duckdb", name: "duckdb-java") {
      __typename
      ...GetOverviewThings
    }
    nodejs: repository(owner: "duckdb", name: "duckdb-node") {
      __typename
      ...GetOverviewThings
    }
    rust: repository(owner: "duckdb", name: "duckdb-rs") {
      __typename
      ...GetOverviewThings
    }
    engine: repository(owner: "Mause", name: "duckdb_engine") {
      __typename
      ...GetOverviewThings
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const octokit = await call(request, GetIssuesAndPullRequestsDocument, {
    searchQuery: `assignee:me is:open sort:updated-desc`,
    order: {
      field: IssueOrderField.UpdatedAt,
      direction: OrderDirection.Desc,
    },
  });

  let items = [];
  for (const value of Object.values(octokit)) {
    if (typeof value !== "string" && value!.__typename === "Repository") {
      const res = getFragment(GetOverviewThingsFragmentDoc, value);
      items.push(
        ...res!.issues!.nodes!.map((issue) => {
          const no = getFragment(IssueOverviewFragmentDoc, issue!);
          return convert(no);
        }),
      );
      items.push(...res!.pullRequests!.nodes!.map((pr) => convert(pr!)));
    }
  }
  items.push(
    ...octokit.search.edges!.map((edge) => {
      const node = edge!.node!;
      if (node.__typename !== "Issue") {
        throw new Error("Expected issue");
      }
      return convert(getFragment(IssueOverviewFragmentDoc, node));
    }),
  );
  items = items.filter((item) => item.title !== "Dependency Dashboard");
  items = _.orderBy(items, (item) => item.updatedAt, "desc");

  return { items };
};

export function Overview({ items }: { items: IssueOrPullRequest[] }) {
  return (
    <DataTable
      data={items}
      columns={[
        {
          id: "__typename",
          header: "Type",
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
          header: "#",
          renderCell(data) {
            return (
              <Link target="_blank" href={data.url}>
                #{data.number}
              </Link>
            );
          },
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
              <Link target="_blank" href={data.repository.url}>
                {data.repository.nameWithOwner}
              </Link>
            );
          },
        },
        {
          id: "updatedAt",
          header: "Updated",
          renderCell: (data) => <RelativeTime datetime={data.updatedAt} />,
        },
      ]}
    ></DataTable>
  );
}

export interface IssueOrPullRequest {
  __typename: "Issue" | "PullRequest";
  id: string;
  updatedAt: string;
  title: string;
  url: string;
  number: number;
  repository: {
    nameWithOwner: string;
    url: string;
  };
}

function convert(item: IssueOrPullRequest): IssueOrPullRequest {
  return {
    __typename: item.__typename!,
    number: item.number,
    repository: {
      nameWithOwner: item.repository.nameWithOwner,
      url: item.repository.url,
    },
    updatedAt: item.updatedAt,
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
