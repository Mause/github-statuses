import { TabNav } from "@primer/react";
import { Outlet } from "@remix-run/react";
import { Link } from "react-router-dom";

export default function DashboardStorySelector() {
  return (
    <>
      <TabNav aria-label="Main">
        <TabNav.Link as={Link} to="dashboard">
          Dashboard
        </TabNav.Link>
        <TabNav.Link as={Link} to="empty">
          Empty
        </TabNav.Link>
      </TabNav>
      <Outlet />
    </>
  );
}
