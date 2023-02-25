import { Form } from "react-bulma-components";
import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import { Spinner } from "@primer/react";
import { Wrapper } from "~/components";

export default function Index() {
  const [value, set] = useState<string>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <Wrapper>
      {<></>}
      {
        <ul>
          <li>
            <a href="/duckdb/duckdb/pulls">duckdb/duckdb</a>
          </li>
          <li>
            <a href="/Mause/duckdb/pulls">Mause/duckdb</a>
          </li>
          <li>
            <a href="/Mause/duckdb_engine/pulls">Mause/duckdb_engine</a>
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
      }
    </Wrapper>
  );
}
