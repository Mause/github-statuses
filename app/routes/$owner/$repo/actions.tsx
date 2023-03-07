import type { SerializeFrom } from "@remix-run/node";
import { json } from "@remix-run/node";
import { createColumnHelper } from "@tanstack/table-core";
import { print } from "graphql";
import gql from "graphql-tag";
import type { Get } from "type-fest";
import type { DataLoaderParams} from "~/components";
import { StandardTable, Wrapper } from "~/components";
import type {
  GetRepositoryActionsQuery,
  GetRepositoryActionsQueryVariables,
} from "~/components/graphql/graphql";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import { getOctokit } from "~/octokit.server";

export const query = gql`
  query GetRepositoryActions($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      pullRequests(
        first: 10
        states: OPEN
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
        edges {
          node {
            title
            url
            commits(first: 5) {
              edges {
                node {
                  commit {
                    message
                    status {
                      id
                    }
                    statusCheckRollup {
                      id
                    }
                    checkSuites(first: 5) {
                      nodes {
                        id
                        workflowRun {
                          url
                          workflow {
                            name
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const loader = async ({
  params,
  request,
}: DataLoaderParams<"owner" | "repo">) => {
  const variables: GetRepositoryActionsQueryVariables = {
    owner: params.owner!,
    repo: params.repo!,
  };
  const actions = await (
    await getOctokit(request)
  ).graphql<GetRepositoryActionsQuery>({
    query: print(query),
    ...variables,
  });
  return json({
    actions: actions
      .repository!.pullRequests!.edges!.map((edge) => edge!.node)
      .flatMap((pullRequest) => pullRequest!.commits.edges!)
      .flatMap((commit) => commit!.node!.commit.checkSuites!.nodes),
  });
};

type Workflow = Get<
  GetRepositoryActionsQuery,
  "repository.pullRequests.edges.0.node.commits.edges.0.node.commit.checkSuites.nodes.0"
>;
const columnHelper = createColumnHelper<SerializeFrom<Workflow>>();
const COLUMNS = [
  columnHelper.accessor("id", { header: "ID" }),
  columnHelper.accessor("workflowRun.workflow.name", { header: "Name" }),
];

export default function Actions() {
  const { actions } = useLoaderDataReloading<typeof loader>();

  return (
    <Wrapper>
      {<></>}
      {
        <StandardTable
          tableOptions={{
            data: actions,
            columns: COLUMNS,
          }}
        />
      }
    </Wrapper>
  );
}
