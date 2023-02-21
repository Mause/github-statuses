import { Container, Form } from "react-bulma-components";
import { useState } from "react";
import { useNavigate } from "@remix-run/react";
import { Box, Header, Spinner } from "@primer/react";

export default function Index() {
  const [value, set] = useState<string>();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <Container style={{ padding: "10px" }}>
      <Box
        sx={{
          overflowY: "auto",
          border: "1px solid",
          borderRadius: "6px",
          borderColor: "border.default",
        }}
      >
        <Header>
          <Header.Item>
            <Header.Link href="/">Action Statuses</Header.Link>
          </Header.Item>
        </Header>
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
      </Box>
    </Container>
  );
}
