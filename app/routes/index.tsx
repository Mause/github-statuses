import { Link, useNavigate, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { TreeView, Header } from "@primer/react";

import type { DataFunctionArgs } from "@remix-run/node";
import { getUser } from "~/octokit.server";
import { useHeader } from "~/components";

export const loader = async ({ request }: DataFunctionArgs) => {
  const user = await getUser(request);
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
    ["duckdb", ["duckdb", "duckdb-web"]],
    ["duckdblabs", ["sqlite_scanner", "substrait", "postgres_scanner"]],
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

  useHeader(
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
  );

  return <TreeView>{nodes}</TreeView>;
}
