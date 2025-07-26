import {
  Text,
  Header,
  PageLayout,
  Breadcrumbs,
  Link as PrimerLink,
  Spinner,
  IconButton,
} from "@primer/react";
import type { UIMatch } from "@remix-run/react";
import { Octicon } from "@primer/react/deprecated";
import { Link, useMatches, useRevalidator } from "@remix-run/react";
import { GearIcon, MarkGithubIcon } from "@primer/octicons-react";
import type { ReactNode } from "react";
import type { SessionShape } from "~/services/auth.server";
import _ from "lodash";
import { titleCase } from "~/components";

export function StandardHeader({
  children,
}: {
  children?: ReactNode[] | ReactNode;
}) {
  const matches = useMatches();
  const root = matches[0].data as { user: Pick<SessionShape, "login"> };
  const user = root?.user;
  const { state } = useRevalidator();

  const settings = (
    <Header.Item>
      <Header.Link as={Link} to="/settings">
        <IconButton aria-label="Settings page link" icon={GearIcon} />
      </Header.Link>
    </Header.Item>
  );

  return (
    // eslint-disable-next-line primer-react/direct-slot-children
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
        {user?.login ? (
          <>
            <Header.Item>
              <Header.Link as={Link} to="/overview">
                Overview
              </Header.Link>
            </Header.Item>
            <Header.Item full>
              <Header.Link as={Link} to={`/${user?.login}/pulls`}>
                My PRs
              </Header.Link>
            </Header.Item>
            {settings}
            <Header.Item>
              <Header.Link as={Link} to="/auth/logout">
                Logout
              </Header.Link>
            </Header.Item>
          </>
        ) : (
          <>
            <Header.Item full />
            {settings}
          </>
        )}
      </Header>
      <Breadcrumbs>
        {matches
          .filter(({ id }) => !id.endsWith("/index"))
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

function getName(match: UIMatch): ReactNode {
  if (match.id === "root") {
    return "Home";
  }

  let segment = _.last(match.pathname.split("/"))!;

  let data = match.data as { name: string } | undefined;
  if (_.isObject(data) && "name" in data) {
    return `${data.name} (${segment})`;
  }

  return titleCase(segment);
}

export default function Wrapper({
  children: [header, body, sidebar],
}: {
  children: [ReactNode, ReactNode] | [ReactNode, ReactNode, ReactNode];
}) {
  return (
    <PageLayout
      sx={{ overflowY: "auto" }}
      padding="condensed"
      rowGap="condensed"
      columnGap="condensed"
      containerWidth="full"
    >
      <StandardHeader>{header}</StandardHeader>
      <PageLayout.Content padding="none">{body}</PageLayout.Content>
      {sidebar ? (
        <PageLayout.Pane
          divider="line"
          position="start"
          width="small"
          sticky
          padding="none"
        >
          {sidebar}
        </PageLayout.Pane>
      ) : undefined}
      <PageLayout.Footer divider="line" padding="none">
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
