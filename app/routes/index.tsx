import { Form } from "react-bulma-components";
import { useState } from "react";
import { useNavigate } from "@remix-run/react";

export default function Index() {
  const [value, set] = useState<string>();
  const navigate = useNavigate();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to GitHub Statuses</h1>
      <ul>
        <li>
          <a href="/duckdb/duckdb/pull/1000">Quickstart</a>
        </li>
        <li>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              navigate(new URL(value!).pathname);
            }}
          >
            <Form.Input onChange={(event) => set(event.target.value)} />
            https://github.com/Mause/duckdb/pull/27
          </form>
        </li>
      </ul>
    </div>
  );
}
