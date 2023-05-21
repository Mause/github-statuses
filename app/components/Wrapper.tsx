import { Text, Header, PageLayout } from "@primer/react";
import { Link, useMatches } from "@remix-run/react";
import { MarkGithubIcon } from "@primer/octicons-react";
import { Spinner, StyledOcticon } from "@primer/react";
import { useRevalidator } from "@remix-run/react";
import type { ReactNode } from "react";

export function StandardHeader({
  children,
}: {
  children?: ReactNode[] | ReactNode;
}) {
  const matches = useMatches();
  const index = matches.find((route) => route.id === "root");
  const user = index?.data?.user;
  const { state } = useRevalidator();

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
          {state == "loading" ? (
            <Spinner size="small" />
          ) : (
            <StyledOcticon icon={MarkGithubIcon} />
          )}
        </Header.Item>
        <Header.Item>
          <Header.Link as={Link} to="/">
            Action Statuses
          </Header.Link>
        </Header.Item>
        {children}
        {user ? (
          <>
            <Header.Item full>
              <Header.Link as={Link} to={`/${user?.login}/pulls`}>
                My PRs
              </Header.Link>
            </Header.Item>
            <Header.Item>
              <Header.Link as={Link} to="/auth/logout">
                Logout
              </Header.Link>
            </Header.Item>
          </>
        ) : undefined}
      </Header>
    </PageLayout.Header>
  );
}

export default function Wrapper({
  children: [header, body, sidebar],
}: {
  children: [ReactNode, ReactNode] | [ReactNode, ReactNode, ReactNode];
}) {
  return (
    <PageLayout sx={{ overflowY: "auto" }} containerWidth="full">
      <StandardHeader children={header} />
      <PageLayout.Content>{body}</PageLayout.Content>
      {sidebar ? (
        <PageLayout.Pane divider="line" position="start">
          {sidebar}
        </PageLayout.Pane>
      ) : undefined}
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
