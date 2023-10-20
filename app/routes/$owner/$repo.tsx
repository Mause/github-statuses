import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { Heading, NavList, Octicon } from "@primer/react";
import type { LoaderFunction } from "@remix-run/node";
import { call } from "~/octokit.server";
import gql from "graphql-tag";
import { GetBasicRepositoryDocument } from "~/components/graphql/graphql";
import { GlobeIcon } from "@primer/octicons-react";

export const GetBasicRepository = gql`
  query GetBasicRepository($owner: String!, $repo: String!) {
    repositoryOwner(login: $owner) {
      repository(name: $repo) {
        nameWithOwner
        url
      }
    }
  }
`;

export const loader: LoaderFunction = async ({ request, params }) => {
  const res = await call(request, GetBasicRepositoryDocument, {
    repo: params.repo!,
    owner: params.owner!,
  });
  const repo = res.repositoryOwner!.repository!;
  return {
    nameWithOwner: repo.nameWithOwner!,
    url: repo.url!,
  };
};

export default function Repo() {
  const { nameWithOwner, url } = useLoaderData<typeof loader>();
  return (
    <>
      <Heading>
        {nameWithOwner}
        <Link to={url}>
          <Octicon icon={GlobeIcon}></Octicon>
        </Link>
      </Heading>
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
