import { Form } from "react-bulma-components";
import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import { Spinner } from "@primer/react";

export default function Index() {
  const [value, set] = useState<string>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to GitHub Statuses</h1>
      <ul>
        <li>
          <a href="/duckdb/duckdb/pull/1000">Quickstart</a>
        </li>
        <li>{loading && <Spinner />}</li>
        <li>
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
        </li>
      </ul>
    </div>
  );
}
