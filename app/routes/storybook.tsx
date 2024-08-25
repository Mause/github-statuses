import { NavList } from "@primer/react";
import { Link, Outlet } from "@remix-run/react";
import { Wrapper, titleCase } from "~/components";
export { ErrorBoundary } from "~/root";

export default function Storybook() {
  return (
    <Wrapper>
      <></>
      <Outlet />
      <NavList>
        {[
          "table",
          "markdown",
          "action_progress",
          "boundary",
          "timeout",
          "dashboard",
          "branches",
          "live_logs",
          "logs",
          "cache",
          "overview",
        ].map((route) => (
          <NavList.Item as={Link} to={route} key={route}>
            {titleCase(route)}
          </NavList.Item>
        ))}
      </NavList>
    </Wrapper>
  );
}
