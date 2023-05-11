import { Link, Outlet, useNavigate } from "@remix-run/react";
import { json } from "@remix-run/node";
import { TreeView, Avatar } from "@primer/react";
import { Wrapper } from "~/components";

import type { DataFunctionArgs, SerializeFrom } from "@remix-run/node";
import { call } from "~/octokit.server";
import gql from "graphql-tag";
import type { ReposFragment } from "~/components/graphql/graphql";
import {
  OrderDirection,
  RepositoryOrderField,
  GetAllReposDocument,
  ReposFragmentDoc,
} from "~/components/graphql/graphql";
import { getFragment } from "~/components/graphql";
import type { FragmentType } from "~/components/graphql/fragment-masking";
import type { DocumentTypeDecoration } from "@graphql-typed-document-node/core";
import { useState } from "react";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";

const INCREMENT = 5;

export const GetAllRepos = gql`
  fragment Repos on RepositoryOwner {
    login
    avatarUrl
    repositories(first: 15, orderBy: $orderBy) {
      nodes {
        name
      }
    }
  }
  query GetAllRepos($orderBy: RepositoryOrder!) {
    viewer {
      ...Repos
    }
    duckdb: repositoryOwner(login: "duckdb") {
      ...Repos
    }
    duckdblabs: repositoryOwner(login: "duckdblabs") {
      ...Repos
    }
  }
`;

export const loader = async ({ request }: DataFunctionArgs) => {
  const res = await call(request, GetAllReposDocument, {
    orderBy: {
      field: RepositoryOrderField.PushedAt,
      direction: OrderDirection.Desc,
    },
  });

  type Child = FragmentType<DocumentTypeDecoration<ReposFragment, any>>;

  const repos = Object.values(res)
    .filter((value) => typeof value !== "string")
    .map((org): [ReposFragment, string[]] => {
      const frag = getFragment(ReposFragmentDoc, org! as Child);
      return [frag, frag.repositories.nodes!.map((repo) => repo!.name)];
    });

  return json({ repos });
};

export default function Index({
  asChildRoute = false,
}: {
  asChildRoute: boolean;
}) {
  const { repos } = useLoaderDataReloading<typeof loader>();

  const nodes = repos.map(([owner, subs]) => (
    <SingleOrg owner={owner} asChildRoute={asChildRoute} subs={subs} />
  ));

  return (
    <Wrapper>
      <></>
      {asChildRoute ? <Outlet /> : <div>Please select a repository</div>}
      <TreeView>{nodes}</TreeView>
    </Wrapper>
  );
}

function SingleOrg({
  owner,
  asChildRoute,
  subs,
}: {
  owner: SerializeFrom<ReposFragment>;
  asChildRoute: boolean;
  subs: string[];
}): JSX.Element {
  const navigate = useNavigate();

  const [limit, setLimit] = useState(INCREMENT);

  return (
    <TreeView.Item
      id={owner.login}
      key={owner.login}
      defaultExpanded={!asChildRoute}
    >
      <TreeView.LeadingVisual>
        <Avatar src={owner.avatarUrl} />
      </TreeView.LeadingVisual>
      {owner.login}
      <TreeView.SubTree>
        {subs.slice(0, limit).map((sub) => {
          const href = `/${owner.login}/${sub}/pulls`;
          return (
            <TreeView.Item key={href} id={href} onSelect={() => navigate(href)}>
              <Link to={href}>{sub}</Link>
            </TreeView.Item>
          );
        })}
        <TreeView.Item
          id="more"
          onSelect={() => setLimit((a) => a + INCREMENT)}
        >
          More
        </TreeView.Item>
      </TreeView.SubTree>
    </TreeView.Item>
  );
}
