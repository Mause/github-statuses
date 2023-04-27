import { Link, Outlet } from "@remix-run/react";
import { Wrapper, titleCase } from "~/components";

export default function Storybook() {
  return (
    <Wrapper>
      <></>
      <Outlet />
      <ul>
        {["table", "markdown", "action_progress"].map((route) => (
          <li key={route}>
            <Link to={route}>{titleCase(route)}</Link>
          </li>
        ))}
      </ul>
    </Wrapper>
  );
}
