import { Form } from "react-bulma-components";
import { useState } from "react";
import { Link, useNavigate } from "@remix-run/react";
import { Box, Spinner, TreeView } from "@primer/react";
import { Wrapper } from "~/components";

const REPOS: [string, string[]][] = [
  [
    "Mause",
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
export default function Index() {
  const [value, set] = useState<string>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const nodes = REPOS.map(([owner, subs]) => (
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
      {<></>}
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
