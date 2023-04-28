import { Link, useNavigate, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { TreeView, Avatar } from "@primer/react";
import { Wrapper } from "~/components";

import type { DataFunctionArgs } from "@remix-run/node";
import { call, getOctokit } from "~/octokit.server";
import gql from "graphql-tag";
import type { ReposFragment } from "~/components/graphql/graphql";
import {
  OrderDirection,
  RepositoryOrderField,
  GetAllReposDocument,
  ReposFragmentDoc,
} from "~/components/graphql/graphql";
import { getFragment } from "~/components/graphql";
import type { FragmentType } from "~/components/graphql/fragment-masking";
import type { DocumentTypeDecoration } from "@graphql-typed-document-node/core";

export const GetAllRepos = gql`
  fragment Repos on RepositoryOwner {
    login
    avatarUrl
    repositories(first: 15, orderBy: $orderBy) {
      nodes {
        name
      }
    }
  }
  query GetAllRepos($orderBy: RepositoryOrder!) {
    viewer {
      ...Repos
    }
    duckdb: repositoryOwner(login: "duckdb") {
      ...Repos
    }
    duckdblabs: repositoryOwner(login: "duckdblabs") {
      ...Repos
    }
  }
`;

export const loader = async ({ request }: DataFunctionArgs) => {
  const octokit = await getOctokit(request);

  const res = await call(octokit, GetAllReposDocument, {
    orderBy: {
      field: RepositoryOrderField.PushedAt,
      direction: OrderDirection.Desc,
    },
  });

  type Child = FragmentType<DocumentTypeDecoration<ReposFragment, any>>;

  const repos = Object.values(res)
    .filter((value) => typeof value !== "string")
    .map((org): [ReposFragment, string[]] => {
      const frag = getFragment(ReposFragmentDoc, org! as Child);
      return [frag, frag.repositories.nodes!.map((repo) => repo!.name)];
    });

  return json({ repos });
};

export default function Index() {
  const { repos } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const nodes = repos.map(([owner, subs]) => (
    <TreeView.Item id={owner.login} key={owner.login} defaultExpanded={true}>
      <TreeView.LeadingVisual>
        <Avatar src={owner.avatarUrl} />
      </TreeView.LeadingVisual>
      {owner.login}
      <TreeView.SubTree>
        {subs.map((sub) => {
          const href = `${owner.login}/${sub}/pulls`;
          return (
            <TreeView.Item key={href} id={href} onSelect={() => navigate(href)}>
              <Link to={href}>{sub}</Link>
            </TreeView.Item>
          );
        })}
      </TreeView.SubTree>
    </TreeView.Item>
  ));

  return (
    <Wrapper>
      <></>
      <></>
      <TreeView>{nodes}</TreeView>
    </Wrapper>
  );
}
