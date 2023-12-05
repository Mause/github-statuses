import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getLogsForUrl } from "~/services/archive.server";
import { getInstallationOctokit } from "~/services/installation";
import { useLoaderData } from "@remix-run/react";

export const loader = async ({ request }: DataFunctionArgs) => {
  const installationOctokit = await getInstallationOctokit(request);

  const workflowRuns =
    await installationOctokit.actions.listWorkflowRunsForRepo({
      owner: "Mause",
      repo: "duckdb",
    });
  const { workflow_runs } = workflowRuns.data;
  const workflow_run =
    workflow_runs.find((run) => run.name === "Windows") || workflow_runs[0];

  return json({
    log_zip: await getLogsForUrl(installationOctokit, workflow_run.logs_url),
  });
};

export default function Logs() {
  const { log_zip } = useLoaderData<typeof loader>();

  return (
    <pre>
      <code>{JSON.stringify(log_zip, undefined, 2)}</code>
    </pre>
  );
}
