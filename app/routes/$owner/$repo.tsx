import { Outlet, useLoaderData } from "@remix-run/react";
import { Heading, TabNav } from "@primer/react";
import type { LoaderFunction } from "@remix-run/node";
import { call } from "~/octokit.server";
import gql from "graphql-tag";
import { GetBasicRepositoryDocument } from "~/components/graphql/graphql";
import { TabNavLink, ExternalLink } from "~/components";

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
        <ExternalLink href={url} variant="invisible">
          {nameWithOwner}
        </ExternalLink>
      </Heading>
      <TabNav>
        <TabNavLink to="./dashboard">Dashboard</TabNavLink>
        <TabNavLink to="./pulls">Pulls</TabNavLink>
        <TabNavLink to="./branches">Branches</TabNavLink>
      </TabNav>
      <Outlet />
    </>
  );
}
