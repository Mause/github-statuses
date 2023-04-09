import { Link, useNavigate, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { TreeView, Header } from "@primer/react";
import { Wrapper } from "~/components";

import type { DataFunctionArgs } from "@remix-run/node";
import { getOctokit, getUser } from "~/octokit.server";
import gql from "graphql-tag";
import { print } from "graphql";
import type { GetAllReposQuery } from "~/components/graphql/graphql";
import { ReposFragmentDoc } from "~/components/graphql/graphql";
import { getFragment } from "~/components/graphql";

export const GetAllRepos = gql`
  fragment Repos on RepositoryOwner {
    repositories(first: 10) {
      nodes {
        name
      }
    }
  }
  query GetAllRepos {
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

  const res = await octokit.graphql<GetAllReposQuery>(print(GetAllRepos));

  const getRepos = (org: GetAllReposQuery["duckdb"]) =>
    getFragment(ReposFragmentDoc, org!).repositories.nodes!.map(
      (repo) => repo!.name
    );

  const repos: [string, string[]][] = [
    [
      user.login,
      [
        "duckdb",
        "duckdb-web",
        "duckdb_engine",
        "mause.github.com",
        "github-statuses",
      ],
    ],
    ["duckdb", getRepos(res.duckdb!)],
    ["duckdblabs", getRepos(res.duckdblabs)],
  ];
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
    <Wrapper
      header={
        <>
          <Header.Item full>
            <Header.Link as={Link} to={`/${user.login}`}>
              My PRs
            </Header.Link>
          </Header.Item>
          <Header.Item>
            <Header.Link as={Link} to="/auth/logout">
              Logout
            </Header.Link>
          </Header.Item>
        </>
      }
    >
      <TreeView>{nodes}</TreeView>
    </Wrapper>
  );
}
