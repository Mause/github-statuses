import { TabNav } from "@primer/react";
import { Outlet } from "@remix-run/react";
import { TabNavLink } from "~/components";

export default function DashboardStorySelector() {
  return (
    <>
      <TabNav aria-label="Main">
        <TabNavLink to="dashboard">Dashboard</TabNavLink>
        <TabNavLink to="empty">Empty</TabNavLink>
        <TabNavLink to="not_a_fork">Not a fork</TabNavLink>
      </TabNav>
      <Outlet />
    </>
  );
}
