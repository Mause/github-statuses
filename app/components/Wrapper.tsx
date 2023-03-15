import { Text, Header, PageLayout } from "@primer/react";
import { Link } from "@remix-run/react";
import type { ReactNode } from "react";

export function StandardHeader({
  children,
}: {
  children?: ReactNode[] | ReactNode;
}) {
  return (
    <PageLayout.Header divider="line">
      <Header
        sx={{
          border: "1px solid",
          borderRadius: "6px",
          borderColor: "border.default",
        }}
      >
        <Header.Item>
          <Header.Link as={Link} to="/">
            Action Statuses
          </Header.Link>
        </Header.Item>
        {children}
      </Header>
    </PageLayout.Header>
  );
}

export default function Wrapper({
  children: [header, body],
}: {
  children: [ReactNode, ReactNode];
}) {
  return (
    <PageLayout sx={{ overflowY: "auto" }}>
      <StandardHeader children={header} />
      <PageLayout.Content>{body}</PageLayout.Content>
      {/*
      <PageLayout.Pane divider="line" position="start">
        <div style={{ height: "120px" }}>
          <p>Sides go here</p>
        </div>
      </PageLayout.Pane>
      */}
      <PageLayout.Footer divider="line">
        <Text as="p" sx={{ color: "fg.primary", p: 2 }}>
          By Elliana (
          <a href="https://github.com/Mause" target="_blank" rel="noreferrer">
            @Mause
          </a>
          )
        </Text>
      </PageLayout.Footer>
    </PageLayout>
  );
}
