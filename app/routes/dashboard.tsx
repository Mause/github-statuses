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
import type { CellContext } from "@tanstack/react-table";

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
        pullRequests(first: 10, orderBy: $order, states: OPEN) {
          nodes {
            id
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
  id: string;
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
        id: pr.id,
        title: pr.title!,
        branchName: headRef.name!,
        mirrored: headRef.associatedPullRequests.nodes?.find(
          (node) => node?.baseRepository?.nameWithOwner == "duckdb/duckdb",
        )?.permalink,
      };
    });
  return json({ pulls, user: user! });
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

    return mirrored ? (
      <a target="_blank" href={mirrored} rel="noreferrer">
        Go
      </a>
    ) : (
      <a target="_blank" href={create} rel="noreferrer">
        Create
      </a>
    );
  }

  const { pulls, user } = useLoaderDataReloading<typeof loader>();

  const tableOptions: StandardTableOptions<MirroredPullRequest> = {
    data: pulls,
    columns: [
      {
        accessorFn: (pr) => pr.id,
        id: "id",
        header: "ID",
      },
      {
        accessorKey: "title",
        header: "Name",
      },
      {
        accessorKey: "mirrored",
        cell: call,
      },
    ],
  };

  return <StandardTable tableOptions={tableOptions}>hello</StandardTable>;
}
