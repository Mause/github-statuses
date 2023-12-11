import { json } from "@remix-run/node";
import gql from "graphql-tag";

import type { DataLoaderParams, StandardTableOptions } from "~/components";
import { StandardTable , ExternalLink } from "~/components";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import { call } from "~/octokit.server";
import {
  GetUserRepoPullRequestsDocument,
  IssueOrderField,
  OrderDirection,
} from "~/components/graphql/graphql";
import { createColumnHelper, type CellContext } from "@tanstack/react-table";
import { Link } from "@remix-run/react";
import { Flash, LinkButton, Link as PrimerLink } from "@primer/react";
import _ from "lodash";
import { URL } from "url";

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
        name
        owner {
          login
        }
        parent {
          name
          owner {
            login
          }
          nameWithOwner
        }
        defaultBranchRef {
          name
        }

        pullRequests(first: 50, orderBy: $order, states: OPEN) {
          nodes {
            number
            resourcePath
            permalink
            title
            body
            headRef {
              name
              associatedPullRequests(first: 5, states: OPEN) {
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
export interface MirroredPullRequest {
  number: number;
  resourcePath: string;
  permalink: string;
  title: string;
  branchName: string;
  mirrored?: string;
  body: string;
}

export function createUrl({
  source,
  target,
  title,
  body,
}: {
  source: Repo;
  target: Repo;
  title: string;
  body: string;
}) {
  const url = new URL("https://github.com/");
  url.pathname += `${target.owner}/${target.repo}/compare/`;
  url.pathname += `${target.branchName}...${source.owner}:${source.repo}:${source.branchName}`;
  url.search = new URLSearchParams({
    quick_pull: "1",
    title,
    body,
  }).toString();
  return url.toString();
}

export async function loader({
  request,
  params,
}: DataLoaderParams<"owner" | "repo">) {
  const { user } = await call(request, GetUserRepoPullRequestsDocument, {
    owner: params.owner!,
    repo: params.repo!,
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
        body: pr.body!,
        resourcePath: pr.resourcePath!,
        permalink: pr.permalink!,
        branchName: headRef.name!,
        mirrored: headRef.associatedPullRequests.nodes?.find(
          (node) =>
            node?.baseRepository?.nameWithOwner == repo.parent?.nameWithOwner,
        )?.permalink,
      };
    });

  return json({
    pulls,
    repo: _.pick(repo, ["name", "owner", "parent", "defaultBranchRef"]),
  });
}

export function Dashboard({
  pulls,
  repo,
}: ReturnType<typeof useLoaderDataReloading<typeof loader>>) {
  const { parent } = repo;
  const selectedRepo = {
    repo: repo.name,
    owner: repo.owner.login,
  };
  const defaultBranchName = repo.defaultBranchRef!.name!;

  function call(props: CellContext<MirroredPullRequest, any>) {
    const mirrored = props.getValue();

    const { original } = props.row;

    const create = createUrl({
      source: {
        ...selectedRepo,
        branchName: original.branchName,
      },
      target: {
        owner: parent!.owner.login,
        repo: parent!.name,
        branchName: defaultBranchName,
      },
      title: original.title,
      body: original.body,
    });

    return mirrored ? (
      <ExternalLink href={mirrored}>Upstream PR</ExternalLink>
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
          <PrimerLink as={Link} to={props.row.original.resourcePath}>
            {props.getValue()}
          </PrimerLink>
        ),
      }),
      {
        accessorKey: "permalink",
        header: "Fork PR",
        cell: (props) => (
          <ExternalLink href={props.getValue()}>Fork PR</ExternalLink>
        ),
      },
      {
        accessorKey: "mirrored",
        header: "Upstream PR",
        cell: call,
      },
    ],
  };

  if (!parent) {
    return (
      <Flash variant="warning">
        This repository is not a fork, so this page cannot be used.
      </Flash>
    );
  }

  return (
    <>
      <StandardTable tableOptions={tableOptions}>
        No pull requests found
      </StandardTable>
    </>
  );
}

export default function () {
  const data = useLoaderDataReloading<typeof loader>();
  return <Dashboard {...data} />;
}
