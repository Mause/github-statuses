import type {
  SerializeFrom,
  TypedResponse,
  V2_MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";

import { useRevalidator } from "@remix-run/react";
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
  LinkExternalIcon,
} from "@primer/octicons-react";
import { Heading, Link, StyledOcticon, Flash } from "@primer/react";
import humanizeDuration from "humanize-duration";
import type { DataLoaderParams } from "~/components";
import { StandardTable, titleCase } from "~/components";
import type { StandardTableOptions } from "~/components/StandardTable";
import type { Dictionary } from "lodash";
import { countBy } from "lodash";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import { getActions } from "./pullNumberQuery";
import type { Get } from "type-fest";
import type {
  PullRequestsFragment} from "~/components/graphql/graphql";
import {
  CheckStatusState
} from "~/components/graphql/graphql";
import { CheckConclusionState } from "~/components/graphql/graphql";
import type { loader as parentLoader } from "~/root";
import _ from "lodash";
import { ActionProgress } from "~/components/ActionProgress";

export const meta: V2_MetaFunction<
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
  const statuses = pr.commits!.nodes![0]?.commit!.checkSuites!.nodes!;

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
    (status) => !TO_SKIP.includes(status!.conclusion!)
  );

  const percentFailed =
    (filteredStatuses.length / augmentedStatuses.length) * 100;

  const counts = countBy(
    augmentedStatuses,
    (status) => status!.conclusion || status!.status
  );

  return json({
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

const color = (component: Icon, color: string) => () =>
  <StyledOcticon icon={component} color={color} />;

const iconMap: Record<NonNullable<Conclusion | Status>, Icon> = {
  SUCCESS: color(CheckIcon, "success.fg"),
  FAILURE: color(XIcon, "danger.fg"),

  SKIPPED: SkipIcon,
  CANCELLED: StopIcon,

  // guesses
  ACTION_REQUIRED: XIcon,
  NEUTRAL: QuestionIcon,
  TIMED_OUT: color(ClockIcon, "danger.fg"),
  IN_PROGRESS: color(DotIcon, "attention.fg"),
  COMPLETED: XIcon,
  QUEUED: HourglassIcon,

  STALE: QuestionIcon,
  PENDING: QuestionIcon,
  REQUESTED: QuestionIcon,
  STARTUP_FAILURE: QuestionIcon,
  WAITING: QuestionIcon,
};

const COLUMNS = [
  columnHelper.accessor("workflowName", {
    header: "Workflow Name",
  }),
  columnHelper.accessor("name", {
    header: "Job Name",
    cell: (props) => (
      <a target="_blank" href={props.row.original.permalink!} rel="noreferrer">
        {props.getValue()}
      </a>
    ),
  }),
  columnHelper.accessor("conclusion", {
    cell: (props) => {
      const { original } = props.row;
      const conclusion =
        original.conclusion ?? original.status ?? CheckStatusState.InProgress;
      return (
        <span>
          {(iconMap[conclusion] ?? QuestionIcon)({})}
          &nbsp;
          {titleCase(conclusion)}
        </span>
      );
    },
    header: "Status",
  }),
  columnHelper.accessor("startedAt", {
    header: "Started At",
  }),
  columnHelper.accessor("duration", {
    cell: (props) =>
      humanizeDuration(props.getValue(), { conjunction: " and ", largest: 2 }),
    header: "Duration",
  }),
  columnHelper.accessor("completedAt", {
    header: "Completed At",
  }),
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
      <Heading>
        <Link target="_blank" href={pr!.permalink}>
          {pr!.title}&nbsp;
          <LinkExternalIcon />
        </Link>
      </Heading>
      {statuses.length ? (
        <ActionProgress counts={counts} progress={progress} />
      ) : null}
      <StandardTable tableOptions={table}>
        {totalStatuses === 0 ? (
          <Flash variant="warning">
            <StyledOcticon icon={QuestionIcon} />
            No jobs found
          </Flash>
        ) : (
          <Flash variant="success">
            <StyledOcticon icon={CheckIcon} />
            Success! All jobs have successfully completed!
          </Flash>
        )}
      </StandardTable>
    </>
  );
}
