import { json } from "@remix-run/node";
import gql from "graphql-tag";

import type { StandardTableOptions } from "~/components";
import { StandardTable } from "~/components";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import { call } from "~/octokit.server";
import {
  GetUserRepoPullRequestsDocument,
  IssueOrderField,
  OrderDirection,
} from "~/components/graphql/graphql";
import type { DataFunctionArgs } from "@sentry/remix/types/utils/vendor/types";
import { createColumnHelper, type CellContext } from "@tanstack/react-table";
import { Link } from "@remix-run/react";
import { LinkExternalIcon } from "@primer/octicons-react";
import { IconButton } from "@primer/react";

export const Query = gql`
  query GetUserRepoPullRequests(
    $owner: String!
    $repo: String!
    $order: IssueOrder!
  ) {
    user(login: $owner) {
      login
      url
      repository(name: $repo) {
        pullRequests(first: 25, orderBy: $order, states: OPEN) {
          nodes {
            number
            resourcePath
            permalink
            title
            headRef {
              name
              associatedPullRequests(first: 5) {
                nodes {
                  baseRepository {
                    nameWithOwner
                  }
                  permalink
                }
              }
            }
          }
        }
      }
    }
  }
`;

interface Repo {
  owner: string;
  repo: string;
  branchName: string;
}
type MirroredPullRequest = {
  number: number;
  resourcePath: string;
  permalink: string;
  title: string;
  branchName: string;
  mirrored?: string;
};

function createUrl({
  source,
  target,
  title,
}: {
  source: Repo;
  target: Repo;
  title: string;
}) {
  return `https://github.com/${target.owner}/${target.repo}/compare/${target.branchName}...${source.owner}:${source.repo}:${source.branchName}?quick_pull=1&title=${title}`;
}

export async function loader({ request }: DataFunctionArgs) {
  const { user } = await call(request, GetUserRepoPullRequestsDocument, {
    owner: "Mause",
    repo: "duckdb",
    order: {
      direction: OrderDirection.Asc,
      field: IssueOrderField.UpdatedAt,
    },
  });

  const pulls = user!
    .repository!.pullRequests.nodes!.map((pr) => pr!)
    .map((pr) => {
      const headRef = pr.headRef!;
      return {
        number: pr.number,
        title: pr.title!,
        resourcePath: pr.resourcePath!,
        permalink: pr.permalink!,
        branchName: headRef.name!,
        mirrored: headRef.associatedPullRequests.nodes?.find(
          (node) => node?.baseRepository?.nameWithOwner == "duckdb/duckdb",
        )?.permalink,
      };
    });
  return json({ pulls, user: user! });
}

function externalLink(mirrored: string) {
  return (
    <Link to={mirrored}>
      <IconButton aria-labelledby="" icon={LinkExternalIcon} />
    </Link>
  );
}
function link(href: string, label: string) {
  return (
    <a target="_blank" href={href} rel="noreferrer">
      {label}
    </a>
  );
}

export default function Dashboard() {
  function call(props: CellContext<MirroredPullRequest, any>) {
    const mirrored = props.getValue();

    const original = props.row.original;

    const selectedRepo = "duckdb";

    const create = createUrl({
      source: {
        owner: user.login,
        repo: selectedRepo,
        branchName: original.branchName,
      },
      target: { owner: "duckdb", repo: selectedRepo, branchName: "main" },
      title: original.title,
    });

    return mirrored
      ? externalLink(mirrored)
      : link(create, "Create upstream pr");
  }

  const { pulls, user } = useLoaderDataReloading<typeof loader>();

  const columnHelper = createColumnHelper<MirroredPullRequest>();

  const tableOptions: StandardTableOptions<MirroredPullRequest> = {
    data: pulls,
    columns: [
      columnHelper.accessor("number", {
        header: "#",
        cell: (props) => `#${props.getValue()}`,
      }),
      columnHelper.accessor("title", {
        header: "Title",
        cell: (props) => (
          <Link to={props.row.original.resourcePath}>{props.getValue()}</Link>
        ),
      }),
      {
        accessorKey: "permalink",
        header: "Fork PR",
        cell: (props) => externalLink(props.getValue()),
      },
      {
        accessorKey: "mirrored",
        header: "Upstream PR",
        cell: call,
      },
    ],
  };

  return <StandardTable tableOptions={tableOptions}>hello</StandardTable>;
}
