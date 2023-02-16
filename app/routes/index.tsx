import { Form } from "react-bulma-components";
import { useRef } from "react";

export default function Index() {
  const [set, value] = useState();
  const navigate = useNavigate();
  const ref = useRef<Form.Input["value"]>("input");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to GitHub Statuses</h1>
      <ul>
        <li>
          <a href="/duckdb/duckdb/pull/1000">Quickstart</a>
        </li>
        <li>
          <form
            submit={() => {
              navigate.navigate();
            }}
          >
            <Form.Input change={(event) => set(event.target.value)} />
            https://github.com/Mause/duckdb/pull/27
          </form>
        </li>
      </ul>
    </div>
  );
}
