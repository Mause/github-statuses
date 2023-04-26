import { Link, Outlet } from "@remix-run/react";
import { Wrapper } from "~/components";

export default function Storybook() {
  return (
    <Wrapper>
      <></>
      <Outlet />
      <ul>
        {["table", "markdown"].map((route) => (
          <li key={route}>
            <Link to={route}>{route}</Link>
          </li>
        ))}
      </ul>
    </Wrapper>
  );
}
