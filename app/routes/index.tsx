import { Form } from "react-bulma-components";
import { useState } from "react";
import { Link, useNavigate, useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { Box, Spinner, TreeView, Header } from "@primer/react";
import { Wrapper } from "~/components";

import type { DataFunctionArgs } from "@remix-run/node";
import { getUser } from "~/octokit.server";

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
  const [value, set] = useState<string>();
  const [loading, setLoading] = useState(false);
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
      {
        <Header.Item>
          <Header.Link to={`/${user.login}`}>My PRs</Header.Link>
        </Header.Item>
      }
      {
        <>
          <TreeView>{nodes}</TreeView>
          <Box>
            {loading && <Spinner />}
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setLoading(true);
                navigate(new URL(value!).pathname);
              }}
            >
              <Form.Input onChange={(event) => set(event.target.value)} />
              <Form.Input type="submit" disabled={loading} />
            </form>
          </Box>
        </>
      }
    </Wrapper>
  );
}
