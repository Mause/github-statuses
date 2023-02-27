import { Box, Header } from "@primer/react";
import type { ReactNode } from "react";
import { Container } from "react-bulma-components";

export default function Wrapper({
  children: [header, body],
}: {
  children: [ReactNode, ReactNode];
}) {
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
          {header}
        </Header>
        {body}
      </Box>
    </Container>
  );
}
