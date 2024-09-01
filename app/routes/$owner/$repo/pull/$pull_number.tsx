import type {
  MetaFunction,
  SerializeFrom,
  TypedResponse,
} from "@remix-run/node";
import { json } from "@remix-run/node";

import { Link, useRevalidator } from "@remix-run/react";
import { createColumnHelper } from "@tanstack/react-table";
import { useInterval } from "react-interval-hook";
import type { Icon } from "@primer/octicons-react";
import {
  SkipIcon,
  XIcon,
  StopIcon,
  CheckIcon,
  QuestionIcon,
  ClockIcon,
  HourglassIcon,
  DotIcon,
  LogIcon,
} from "@primer/octicons-react";
import {
  Heading,
  Link as PrimerLink,
  Octicon,
  Flash,
  IconButton,
} from "@primer/react";
import humanizeDuration from "humanize-duration";
import type { DataLoaderParams } from "~/components";
import { StandardTable, ExternalLink, titleCase } from "~/components";
import type { StandardTableOptions } from "~/components/StandardTable";
import type { Dictionary } from "lodash";
import { countBy } from "lodash";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import type { Get } from "type-fest";
import type {
  GetActionsForPullRequestQueryVariables,
  PullRequestsFragment,
} from "~/components/graphql/graphql";
import {
  CheckStatusState,
  CheckConclusionState,
  GetActionsForPullRequestDocument,
  PullRequestsFragmentDoc,
} from "~/components/graphql/graphql";
import type { loader as parentLoader } from "~/root";
import { ActionProgress } from "~/components/ActionProgress";
import { captureMessage } from "@sentry/remix";
import gql from "graphql-tag";
import { call as call$ } from "~/octokit.server";
import { getFragment } from "~/components/graphql";
import { serverOnly$ } from "vite-env-only/macros";

export const fragment = gql`
  fragment PullRequests on Repository {
    pullRequest(number: $prNumber) {
      title
      state
      permalink
      commits(last: 1) {
        nodes {
          commit {
            checkSuites(first: 100) {
              nodes {
                app {
                  name
                }
                workflowRun {
                  workflow {
                    name
                  }
                }
                conclusion
                checkRuns(first: 100) {
                  nodes {
                    checkSuite {
                      workflowRun {
                        databaseId
                      }
                    }
                    name
                    conclusion
                    startedAt
                    completedAt
                    permalink
                    repository {
                      nameWithOwner
                    }
                    status
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

export const query = gql`
  query GetActionsForPullRequest(
    $owner: String!
    $repo: String!
    $prNumber: Int!
  ) {
    repositoryOwner(login: $owner) {
      repository(name: $repo) {
        ...PullRequests
      }
    }
  }
`;

const call = serverOnly$(call$);

export async function getActions(
  request: Request,
  variables: Required<GetActionsForPullRequestQueryVariables>,
): Promise<NonNullable<PullRequestsFragment["pullRequest"]>> {
  const thing = await call!(
    request,
    GetActionsForPullRequestDocument,
    variables,
  );

  return getFragment(
    PullRequestsFragmentDoc,
    thing.repositoryOwner?.repository,
  )!.pullRequest!;
}

export const meta: MetaFunction<
  typeof loader,
  {
    "/": typeof parentLoader;
  }
> = ({ data, matches }) => [
  ...matches
    .flatMap((match) => match.meta ?? [])
    .filter((meta) => !("title" in meta)),
  { title: (data?.pr ? `${data?.pr?.title} | ` : "") + "Action Statuses" },
];

const TO_SKIP: CheckConclusionState[] = [
  CheckConclusionState.Success,
  CheckConclusionState.Skipped,
  CheckConclusionState.Neutral,
];

export const loader = async ({
  params,
  request,
}: DataLoaderParams<"repo" | "owner" | "pull_number">): Promise<
  TypedResponse<ReturnShape>
> => {
  const pr = await getActions(request, {
    repo: params.repo!,
    owner: params.owner!,
    prNumber: Number(params.pull_number!),
  });
  const statuses = pr.commits!.nodes![0]!.commit!.checkSuites!.nodes!;

  const augmentedStatuses = statuses.flatMap((status): Item[] => {
    const workflowName =
      status!.workflowRun?.workflow?.name ?? status!.app!.name!;

    return status!.checkRuns!.nodes!.map((node) => {
      const started_at = Date.parse(node!.startedAt!);
      const poi = Date.parse(node!.completedAt!) || Date.now();

      return Object.assign({}, node, {
        workflowName,
        duration: poi - started_at,
      });
    });
  });

  const filteredStatuses = augmentedStatuses.filter(
    (status) => !TO_SKIP.includes(status!.conclusion!),
  );

  const percentFailed =
    (filteredStatuses.length / augmentedStatuses.length) * 100;

  const counts = countBy(
    augmentedStatuses,
    (status) => status!.conclusion || status!.status,
  );

  return json({
    name: pr.title,
    statuses: filteredStatuses,
    totalStatuses: augmentedStatuses.length,
    pr,
    progress: Math.round(100 - percentFailed),
    counts,
  });
};

type Check = NonNullable<
  Get<
    PullRequestsFragment,
    "pullRequest.commits.nodes.0.commit.checkSuites.nodes.0.checkRuns.nodes.0"
  >
>;

type Conclusion = Check["conclusion"];
type Status = Check["status"];

type Item = Check & { workflowName: string; duration: number };
type ReturnShape = {
  statuses: Item[];
  totalStatuses: number;
  pr: PullRequestsFragment["pullRequest"];
  progress: number;
  counts: Dictionary<number>;
};

const columnHelper = createColumnHelper<SerializeFrom<Item>>();

const color =
  (
    component: Icon,
    color:
      | "success.fg"
      | "danger.fg"
      | "attention.fg"
      | "neutral.emphasis" = "neutral.emphasis",
  ) =>
  () => <Octicon icon={component} color={color} />;

const iconMap: Record<NonNullable<Conclusion | Status>, Icon> = {
  SUCCESS: color(CheckIcon, "success.fg"),
  FAILURE: color(XIcon, "danger.fg"),

  SKIPPED: color(SkipIcon),
  CANCELLED: color(StopIcon),

  // guesses
  ACTION_REQUIRED: color(XIcon),
  NEUTRAL: color(QuestionIcon),
  TIMED_OUT: color(ClockIcon, "danger.fg"),
  IN_PROGRESS: color(DotIcon, "attention.fg"),
  COMPLETED: color(XIcon),
  QUEUED: color(HourglassIcon),

  STALE: color(QuestionIcon),
  PENDING: color(QuestionIcon),
  REQUESTED: color(QuestionIcon),
  STARTUP_FAILURE: color(QuestionIcon),
  WAITING: color(QuestionIcon),
};

const COLUMNS = [
  columnHelper.accessor("workflowName", {
    header: "Workflow Name",
  }),
  columnHelper.accessor("name", {
    header: "Job Name",
    cell: (props) => (
      <PrimerLink
        target="_blank"
        href={props.row.original.permalink!}
        rel="noreferrer"
      >
        {props.getValue()}
      </PrimerLink>
    ),
  }),
  columnHelper.accessor("conclusion", {
    cell: (props) => {
      const { original } = props.row;
      let conclusion = original.conclusion ?? original.status;

      if (!conclusion) {
        captureMessage("`conclusion ?? status` was non-truthy", {
          level: "warning",
          extra: original,
        });
        conclusion = CheckStatusState.InProgress;
      }

      const fn = iconMap[conclusion] ?? color(QuestionIcon, "danger.fg");
      if (!(conclusion in iconMap) || !fn) {
        captureMessage(
          `Missing entry for: ${conclusion}. Falling back to QuestionIcon.`,
          { level: "warning" },
        );
      }

      return (
        <span>
          {fn({})}
          &nbsp;
          {titleCase(conclusion)}
        </span>
      );
    },
    header: "Status",
  }),
  columnHelper.display({
    cell(props) {
      const { original } = props.row;
      const workflowRun = original.checkSuite!.workflowRun;
      if (!workflowRun) {
        return undefined;
      }
      const to = `/${original.repository.nameWithOwner}/actions/${workflowRun.databaseId}/logs`;

      return (
        <IconButton
          icon={LogIcon}
          as={Link}
          aria-label="Logs"
          to={to}
        ></IconButton>
      );
    },
    header: "Logs",
  }),
  /*
  columnHelper.accessor("startedAt", {
    header: "Started At",
  }),
  */
  columnHelper.accessor("duration", {
    cell: (props) =>
      humanizeDuration(props.getValue(), { conjunction: " and ", largest: 2 }),
    header: "Duration",
  }),
  /*
  columnHelper.accessor("completedAt", {
    header: "Completed At",
  }),
  */
];

export default function Index() {
  const { statuses, pr, progress, counts, totalStatuses } =
    useLoaderDataReloading<typeof loader>();

  const table: StandardTableOptions<SerializeFrom<Item>> = {
    data: statuses,
    columns: COLUMNS,
  };

  const { revalidate } = useRevalidator();
  useInterval(() => revalidate(), 30000);

  return (
    <>
      <Heading as="h1">
        {pr!.title}
        <ExternalLink href={pr!.permalink} variant="invisible">
          Link to pull request
        </ExternalLink>
      </Heading>
      {statuses.length ? (
        <ActionProgress counts={counts} progress={progress} />
      ) : null}
      <StandardTable tableOptions={table}>
        {totalStatuses === 0 ? (
          <Flash variant="warning">
            <Octicon icon={QuestionIcon} />
            No jobs found
          </Flash>
        ) : (
          <Flash variant="success">
            <Octicon icon={CheckIcon} />
            Success! All jobs have successfully completed!
          </Flash>
        )}
      </StandardTable>
    </>
  );
}
