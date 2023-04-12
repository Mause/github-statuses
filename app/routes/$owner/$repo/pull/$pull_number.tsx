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
import { Header, Spinner, StyledOcticon, Flash } from "@primer/react";
import humanizeDuration from "humanize-duration";
import type { DataLoaderParams } from "~/components/index";
import { StandardTable, Wrapper } from "~/components/index";
import type { StandardTableOptions } from "~/components/StandardTable";
import { countBy } from "lodash";
import { titleCase } from "./titleCase";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import { getActions } from "./pullNumberQuery";
import type { Get } from "type-fest";
import type { PullRequestsFragment } from "~/components/graphql/graphql";
import { CheckConclusionState } from "~/components/graphql/graphql";
import type { loader as parentLoader } from "~/root";

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
  console.log(`recieved statuses: ${statuses.length}`);

  const augmentedStatuses = statuses.flatMap((status): Item[] => {
    const workflowName =
      status!.workflowRun?.workflow?.name ?? status!.app!.name!;

    return status!
      .checkRuns!.nodes!.filter((status) => {
        console.log({ conclusion: status!.conclusion, status: TO_SKIP });
        return !TO_SKIP.includes(status!.conclusion!);
      })
      .map((node) => {
        const started_at = Date.parse(node!.startedAt!);
        const poi = Date.parse(node!.completedAt!) || Date.now();

        return Object.assign({}, node, {
          workflowName,
          duration: poi - started_at,
        });
      });
  });

  return json({
    statuses: augmentedStatuses,
    pr,
    progress: Math.round(
      100 - (augmentedStatuses.length / statuses.length) * 100
    ),
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
  pr: PullRequestsFragment["pullRequest"];
  progress: number;
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
      const conclusion =
        (props.row.getValue("conclusion") as Conclusion) || "IN_PROGRESS";

      return (
        <span>
          {iconMap[conclusion]({})}
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

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <Wrapper>
      {<></>}
      <div>
        An error has occured. Goodbye.
        <br />
        <code>
          <pre>{error.stack}</pre>
        </code>
      </div>
    </Wrapper>
  );
}

export default function Index() {
  const { statuses, pr, progress } = useLoaderDataReloading<typeof loader>();

  const table: StandardTableOptions<SerializeFrom<Item>> = {
    data: statuses,
    columns: COLUMNS,
  };

  const { revalidate, state } = useRevalidator();
  useInterval(() => revalidate(), 30000);

  const counts = countBy(
    statuses,
    (status) => status.conclusion || status.status
  );
  const summary = Object.entries(counts)
    .map(([key, value]) => `${value} ${key.toLocaleLowerCase()}`)
    .join(", ");

  return (
    <Wrapper>
      <>
        <Header.Item>
          <Header.Link target="_blank" href={pr!.permalink}>
            {pr!.title}&nbsp;
            <LinkExternalIcon />
          </Header.Link>
        </Header.Item>
        <Header.Item full>
          {state == "loading" ? <Spinner size="small" /> : null}
        </Header.Item>
        {statuses.length ? (
          <Header.Item>
            {summary}, so {progress}% complete
          </Header.Item>
        ) : null}
      </>
      {statuses.length ? (
        <StandardTable tableOptions={table} />
      ) : (
        <Flash variant="success">
          <StyledOcticon icon={CheckIcon} />
          Success! All jobs have successfully completed!
        </Flash>
      )}
    </Wrapper>
  );
}
