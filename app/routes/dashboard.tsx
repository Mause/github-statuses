import { json } from "@remix-run/node";
import gql from "graphql-tag";

import type { StandardTableOptions } from "~/components";
import { StandardTable } from "~/components";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import { call, getUser } from "~/octokit.server";
import {
  GetUserRepoPullRequestsDocument,
  IssueOrderField,
  OrderDirection,
} from "~/components/graphql/graphql";
import type { DataFunctionArgs } from "@sentry/remix/types/utils/vendor/types";
import { createColumnHelper, type CellContext } from "@tanstack/react-table";
import { Link } from "@remix-run/react";
import { LinkExternalIcon } from "@primer/octicons-react";
import { IconButton, LinkButton } from "@primer/react";

const selectedRepo = "duckdb";

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
        parent {
          name
          owner {
            login
          }
          nameWithOwner
        }

        refs(refPrefix: "refs/heads/", first: 100) {
          nodes {
            name

            associatedPullRequests {
              totalCount
            }
          }
        }

        pullRequests(first: 50, orderBy: $order, states: OPEN) {
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
interface Ref {
  name: string;
}

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
  const loggedInUser = await getUser(request);

  const { user } = await call(request, GetUserRepoPullRequestsDocument, {
    owner: loggedInUser.login,
    repo: selectedRepo,
    order: {
      direction: OrderDirection.Desc,
      field: IssueOrderField.UpdatedAt,
    },
  });

  const repo = user!.repository!;

  const pulls = repo.pullRequests
    .nodes!.map((pr) => pr!)
    .map((pr) => {
      const headRef = pr.headRef!;
      return {
        number: pr.number,
        title: pr.title!,
        resourcePath: pr.resourcePath!,
        permalink: pr.permalink!,
        branchName: headRef.name!,
        mirrored: headRef.associatedPullRequests.nodes?.find(
          (node) =>
            node?.baseRepository?.nameWithOwner == repo.parent!.nameWithOwner,
        )?.permalink,
      };
    });

  return json({
    pulls,
    user: user!,
    refs: repo
      .refs!.nodes!.filter(
        (node) =>
          node!.associatedPullRequests.totalCount === 0 &&
          node!.name !== "main",
      )
      .map((node) => node!),
  });
}

function externalLink(mirrored: string) {
  return (
    <Link to={mirrored} target="_blank">
      <IconButton aria-labelledby="" icon={LinkExternalIcon} />
    </Link>
  );
}

export function Dashboard({
  pulls,
  user,
  parent,
  refs,
}: {
  pulls: MirroredPullRequest[];
  refs: Ref[];
  parent: { nameWithOwner: string; name: string; owner: { login: string } };
  user: { login: string };
}) {
  function call(props: CellContext<MirroredPullRequest, any>) {
    const mirrored = props.getValue();

    const original = props.row.original;

    const create = createUrl({
      source: {
        owner: user.login,
        repo: selectedRepo,
        branchName: original.branchName,
      },
      target: {
        owner: parent.owner.login,
        repo: parent.name,
        branchName: "main",
      },
      title: original.title,
    });

    return mirrored ? (
      externalLink(mirrored)
    ) : (
      <LinkButton target="_blank" href={create}>
        Create upstream pr
      </LinkButton>
    );
  }

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

  const refTableOptions: StandardTableOptions<Ref> = {
    data: refs,
    columns: [
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        id: "create",
        header: "Create PR",
        cell: (props) => {
          const branchName = props.row.original.name;

          const create = createUrl({
            source: {
              owner: user.login,
              repo: selectedRepo,
              branchName,
            },
            target: {
              owner: user.login,
              repo: selectedRepo,
              branchName: "main",
            },
            title: branchName,
          });

          return (
            <LinkButton target="_blank" href={create}>
              Create fork pr
            </LinkButton>
          );
        },
      },
    ],
  };

  return (
    <>
      <StandardTable tableOptions={tableOptions}>
        No pull requests found
      </StandardTable>
      <hr />
      <StandardTable tableOptions={refTableOptions}>
        No refs found
      </StandardTable>
    </>
  );
}

export default function () {
  const { pulls, user, refs } = useLoaderDataReloading<typeof loader>();
  return (
    <Dashboard
      pulls={pulls}
      user={user}
      refs={refs}
      parent={user!.repository!.parent!}
    />
  );
}
