import * as fs from "fs";
import { basename, extname } from "path";
import { Link, useLoaderData } from "@remix-run/react";
import { Wrapper } from "~/components";

export const loader = () =>
  fs
    .readdirSync("./app/routes/storybook")
    .map((route) => basename(route, extname(route)))
    .filter((route) => route != "index");

export default function Storybook() {
  const routes = useLoaderData<typeof loader>();

  return (
    <Wrapper>
      <></>
      <ul>
        {routes.map((route) => (
          <li key={route}>
            <Link to={route}>{route}</Link>
          </li>
        ))}
      </ul>
    </Wrapper>
  );
}
