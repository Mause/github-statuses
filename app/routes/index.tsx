import { Link, useNavigate, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { TreeView, Header } from "@primer/react";
import { Wrapper } from "~/components";

import type { DataFunctionArgs } from "@remix-run/node";
import { call, getOctokit, getUser } from "~/octokit.server";
import gql from "graphql-tag";
import type {
  GetAllReposQuery,
  ReposFragment,
} from "~/components/graphql/graphql";
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
    repositories(first: 25, orderBy: $orderBy) {
      nodes {
        name
      }
    }
  }
  query GetAllRepos($user: String!, $orderBy: RepositoryOrder!) {
    user: repositoryOwner(login: $user) {
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
  const user = await getUser(request);
  const octokit = await getOctokit(request);

  const res = await call(octokit, GetAllReposDocument, {
    user: user.login,
    orderBy: {
      field: RepositoryOrderField.PushedAt,
      direction: OrderDirection.Desc,
    },
  });

  type Child = FragmentType<DocumentTypeDecoration<ReposFragment, any>>;

  const repos = Object.values(res)
    .filter((value) => typeof value !== "string")
    .map((org): [string, string[]] => {
      const frag = getFragment(ReposFragmentDoc, org! as Child);
      return [frag.login, frag.repositories.nodes!.map((repo) => repo!.name)];
    });

  return json({ user, repos });
};

export default function Index() {
  const { repos, user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const nodes = repos.map(([owner, subs]) => (
    <TreeView.Item id={owner} key={owner} defaultExpanded={true}>
      {owner}
      <TreeView.SubTree>
        {subs.map((sub) => {
          const id = `${owner}/${sub}`;
          const href = `/${id}/pulls`;
          return (
            <TreeView.Item key={id} id={id} onSelect={() => navigate(href)}>
              <Link to={href}>{sub}</Link>
            </TreeView.Item>
          );
        })}
      </TreeView.SubTree>
    </TreeView.Item>
  ));

  return (
    <Wrapper>
      <>
        <Header.Item full>
          <Header.Link as={Link} to={`/${user.login}/pulls`}>
            My PRs
          </Header.Link>
        </Header.Item>
        <Header.Item>
          <Header.Link as={Link} to="/auth/logout">
            Logout
          </Header.Link>
        </Header.Item>
      </>
      <TreeView>{nodes}</TreeView>
    </Wrapper>
  );
}
