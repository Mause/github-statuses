import {
  Text,
  Header,
  PageLayout,
  Breadcrumbs,
  Link as PrimerLink,
  Spinner,
  Octicon,
} from "@primer/react";
import { Link, useMatches, useRevalidator } from "@remix-run/react";
import type { RouteMatch } from "@remix-run/react";
import { MarkGithubIcon } from "@primer/octicons-react";
import type { ReactNode } from "react";
import type { SessionShape } from "~/services/auth.server";
import _ from "lodash";
import { titleCase } from "~/components";
import { ColorModeSetting } from "./ColorModeSetting";

export function StandardHeader({
  children,
}: {
  children?: ReactNode[] | ReactNode;
}) {
  const matches = useMatches();
  const root = matches[0].data as { user: Pick<SessionShape, "login"> };
  const user = root?.user;
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
            <Octicon icon={MarkGithubIcon} />
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
            <ColorModeSetting />
            <Header.Item>
              <Header.Link as={Link} to="/auth/logout">
                Logout
              </Header.Link>
            </Header.Item>
          </>
        ) : undefined}
      </Header>
      <Breadcrumbs>
        {matches
          .filter(({ id }) => id !== "routes/index")
          .map((match) => (
            <Breadcrumbs.Item
              key={match.id}
              selected={match.id === _.last(matches)?.id}
              to={match.pathname}
              as={Link}
            >
              {getName(match)}
            </Breadcrumbs.Item>
          ))}
      </Breadcrumbs>
    </PageLayout.Header>
  );
}

function getName(match: RouteMatch): ReactNode {
  let segment = _.last(match.pathname.split("/"))!;

  if (segment == "") {
    segment = "home";
  }

  return titleCase(segment);
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
          <PrimerLink
            href="https://github.com/Mause"
            target="_blank"
            rel="noreferrer"
          >
            @Mause
          </PrimerLink>
          )
        </Text>
      </PageLayout.Footer>
    </PageLayout>
  );
}
