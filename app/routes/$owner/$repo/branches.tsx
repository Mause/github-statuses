import { json } from "@remix-run/node";
import gql from "graphql-tag";

import type { DataLoaderParams, StandardTableOptions } from "~/components";
import { StandardTable } from "~/components";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import { call } from "~/octokit.server";
import { GetUserRepoBranchesDocument } from "~/components/graphql/graphql";
import { LinkButton } from "@primer/react";
import _ from "lodash";
import { createUrl } from "./dashboard";

export const Query = gql`
  query GetUserRepoBranches($owner: String!, $repo: String!) {
    user(login: $owner) {
      login
      url
      repository(name: $repo) {
        name
        owner {
          login
        }
        defaultBranchRef {
          name
        }

        refs(refPrefix: "refs/heads/", first: 100) {
          nodes {
            name

            associatedPullRequests(states: OPEN) {
              totalCount
            }
          }
        }
      }
    }
  }
`;

interface Ref {
  name: string;
}

export async function loader({
  request,
  params,
}: DataLoaderParams<"owner" | "repo">) {
  const { user } = await call(request, GetUserRepoBranchesDocument, {
    owner: params.owner!,
    repo: params.repo!,
  });

  const repo = user!.repository!;

  const defaultBranchRef = repo.defaultBranchRef!.name;

  return json({
    repo: _.pick(repo, ["name", "owner", "parent", "defaultBranchRef"]),
    refs: repo
      .refs!.nodes!.filter(
        (node) =>
          node!.associatedPullRequests.totalCount === 0 &&
          node!.name !== defaultBranchRef,
      )
      .map((node) => node!),
  });
}

export function Dashboard({
  repo,
  refs,
}: ReturnType<typeof useLoaderDataReloading<typeof loader>>) {
  const selectedRepo = {
    repo: repo.name!,
    owner: repo.owner!.login,
  };
  const defaultBranchName = repo.defaultBranchRef!.name!;

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
              ...selectedRepo,
              branchName,
            },
            target: {
              ...selectedRepo,
              branchName: defaultBranchName,
            },
            title: branchName,
            body: "",
          });

          return (
            <LinkButton target="_blank" href={create}>
              Create pr
            </LinkButton>
          );
        },
      },
    ],
  };

  return (
    <>
      <StandardTable tableOptions={refTableOptions}>
        No refs found
      </StandardTable>
    </>
  );
}

export default function () {
  const data = useLoaderDataReloading<typeof loader>();
  return <Dashboard {...data} />;
}
