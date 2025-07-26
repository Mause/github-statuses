import { TabNav } from "@primer/react/deprecated";
import { Outlet } from "@remix-run/react";
import { TabNavLink } from "~/components";

export default function DashboardStorySelector() {
  return (
    <>
      <TabNav aria-label="Main">
        <TabNavLink to="branches">Branches</TabNavLink>
        <TabNavLink to="empty">Empty</TabNavLink>
      </TabNav>
      <Outlet />
    </>
  );
}
