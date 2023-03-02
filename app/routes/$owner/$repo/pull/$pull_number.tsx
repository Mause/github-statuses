import type { MetaFunction, TypedResponse } from "@remix-run/node";
import { json } from "@remix-run/node";

import type { Params } from "@remix-run/react";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import type { Octokit } from "@octokit/rest";
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
import { Header, Spinner, StyledOcticon } from "@primer/react";
import { getOctokit } from "~/octokit.server";
import { getWorkflowName } from "./getWorkflowName";
import humanizeDuration from "humanize-duration";
import type { DataLoaderParams} from "~/components/index";
import { StandardTable, Wrapper } from "~/components/index";
import type { StandardTableOptions } from "~/components/StandardTable";
import { countBy } from "lodash";

export const meta: MetaFunction = ({ data }) => ({
  title: (data?.pr ? `${data?.pr?.title} | ` : "") + "Action Statuses",
});

export const loader = async ({
  params,
  request,
}: DataLoaderParams<"repo" | "owner" | "pull_number">): Promise<
  TypedResponse<ReturnShape>
> => {
  const args = {
    repo: params.repo!,
    owner: params.owner!,
    pull_number: Number(params.pull_number!),
  };

  const octokitI = await getOctokit(request);
  const pr = await octokitI.rest.pulls.get(args);
  if (pr.status !== 200) {
    throw new Error(JSON.stringify(pr.data));
  }
  const statuses = await octokitI.paginate(
    octokitI.rest.checks.listForRef,
    {
      ...args,
      ref: pr.data.head.sha,
    },
    (response) => {
      if (response.status !== 200) {
        throw new Error(JSON.stringify(response.data));
      }
      return response.data;
    }
  );

  const augmentedStatuses = await Promise.all(
    statuses
      .filter((status) => !["success", "skipped"].includes(status.conclusion!))
      .map(async (status: Check): Promise<Item> => {
        const started_at = Date.parse(status.started_at!);
        const poi = Date.parse(status.completed_at!) || Date.now();

        const run_id = getRunId(status);
        const workflowName = run_id
          ? await getWorkflowName(octokitI, params.owner!, params.repo!, run_id)
          : status.app!.name!;

        return Object.assign(status, {
          workflowName,
          duration: poi - started_at,
        });
      })
  );

  return json({
    statuses: augmentedStatuses,
    pr: pr.data,
    progress: Math.round(
      100 - (augmentedStatuses.length / statuses.length) * 100
    ),
  });
};

type PR = Awaited<ReturnType<Octokit["rest"]["pulls"]["get"]>>["data"];

type Check = Awaited<
  ReturnType<Octokit["rest"]["checks"]["listForRef"]>
>["data"]["check_runs"][0];

type Conclusion = Check["conclusion"];
type Status = Check["status"];

type Item = Check & { workflowName: string; duration: number };
type ReturnShape = { statuses: Item[]; pr: PR; progress: number };

const columnHelper = createColumnHelper<Item>();

function getRunId(status: Check): number | undefined {
  const details_url = status.details_url!;

  const match = /runs\/(\d+)\/jobs/.exec(details_url);

  return match ? Number(match[1]) : undefined;
}

const color = (component: Icon, color: string) => () =>
  <StyledOcticon icon={component} color={color} />;

const iconMap: Record<NonNullable<Conclusion | Status>, Icon> = {
  success: color(CheckIcon, "success.fg"),
  failure: color(XIcon, "danger.fg"),

  skipped: SkipIcon,
  cancelled: StopIcon,

  // guesses
  action_required: XIcon,
  neutral: QuestionIcon,
  timed_out: color(ClockIcon, "danger.fg"),
  in_progress: color(DotIcon, "attention.fg"),
  completed: XIcon,
  queued: HourglassIcon,
};

const COLUMNS = [
  columnHelper.accessor("workflowName", {
    header: "Workflow Name",
  }),
  columnHelper.accessor("name", {
    header: "Job Name",
    cell: (props) => (
      <a target="_blank" href={props.row.original.html_url!} rel="noreferrer">
        {props.getValue()}
      </a>
    ),
  }),
  columnHelper.accessor("conclusion", {
    cell: (props) => {
      const conclusion =
        (props.row.getValue("conclusion") as Conclusion) || "in_progress";

      let c = conclusion.split("_").join(" ");
      c = c.slice(0, 1).toUpperCase() + c.slice(1);

      return (
        <span>
          {iconMap[conclusion]({})}
          &nbsp;
          {c}
        </span>
      );
    },
    header: "Status",
  }),
  columnHelper.accessor("started_at", {
    header: "Started At",
  }),
  columnHelper.accessor("duration", {
    cell: (props) =>
      humanizeDuration(props.getValue(), { conjunction: " and ", largest: 2 }),
    header: "Duration",
  }),
  columnHelper.accessor("completed_at", {
    header: "Completed At",
  }),
];

export function ErrorBoundary({ error }: { error: Error }) {
  return (
    <Wrapper>
      {<></>}
      {
        <div>
          An error has occured. Goodbye.
          <br />
          <code>
            <pre>{error.stack}</pre>
          </code>
        </div>
      }
    </Wrapper>
  );
}

export default function Index() {
  const { statuses, pr, progress } = useLoaderData<typeof loader>();

  const table: StandardTableOptions<Item> = {
    data: statuses,
    columns: COLUMNS,
  };

  const { revalidate, state } = useRevalidator();
  useInterval(() => revalidate(), 30000);

  const counts = countBy(statuses, "conclusion");
  const summary = Object.entries(counts)
    .map(([key, value]) => `${value} ${key}`)
    .join(", ");

  return (
    <Wrapper>
      {
        <>
          <Header.Item>
            <Header.Link target="_blank" href={pr._links.html.href}>
              {pr.title}&nbsp;
              <LinkExternalIcon />
            </Header.Link>
          </Header.Item>
          <Header.Item full>
            {state == "loading" && <Spinner size="small" />}
          </Header.Item>
          <Header.Item>
            {summary}, so {progress}% complete
          </Header.Item>
        </>
      }
      {<StandardTable tableOptions={table} />}
    </Wrapper>
  );
}
