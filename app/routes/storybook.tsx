import { Link as PrimerLink } from "@primer/react";
import { Link, Outlet } from "@remix-run/react";
import { Wrapper, titleCase } from "~/components";
export { ErrorBoundary } from "~/root";

export default function Storybook() {
  return (
    <Wrapper>
      <></>
      <Outlet />
      <ul>
        {[
          "table",
          "markdown",
          "action_progress",
          "boundary",
          "timeout",
          "dashboard",
          "live_logs",
        ].map((route) => (
          <li key={route}>
            <PrimerLink as={Link} to={route}>
              {titleCase(route)}
            </PrimerLink>
          </li>
        ))}
      </ul>
    </Wrapper>
  );
}
