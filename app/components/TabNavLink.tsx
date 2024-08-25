import { Link, useHref, useMatch } from "@remix-run/react";
import { TabNav } from "@primer/react";
import type { ReactNode } from "react";

export function TabNavLink({
  children,
  to,
}: {
  children: ReactNode;
  to: string;
}) {
  const current = !!useMatch(useHref(to, { relative: "route" }));
  return (
    <TabNav.Link
      as={Link}
      relative="route"
      to={to}
      aria-current={current ? "page" : false}
      selected={current}
    >{children}</TabNav.Link>
  );
}
