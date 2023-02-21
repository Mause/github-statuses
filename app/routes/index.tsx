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
          <Header.Item>
            <Header.Link href="/duckdb/duckdb/pull/1000">
              Quickstart
            </Header.Link>
          </Header.Item>
        </Header>
        <ul>
          <li>https://github.com/Mause/duckdb/pull/27</li>
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
