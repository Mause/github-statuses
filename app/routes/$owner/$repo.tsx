import { Link, Outlet } from "@remix-run/react";
import { NavList } from "@primer/react";

export default function Repo() {
  return (
    <>
      <NavList>
        <NavList.Item as={Link} relative="route" to="./dashboard">
          Dashboard
        </NavList.Item>
        <NavList.Item as={Link} relative="route" to="./pulls">
          Pulls
        </NavList.Item>
      </NavList>
      <Outlet />
    </>
  );
}
