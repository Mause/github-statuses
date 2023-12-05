import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { getOctokit } from "~/octokit.server";

export const loader: LoaderFunction = async ({ request, params }) => {
  const octokit = await getOctokit(request);

  const res = await octokit.actions.getWorkflowRun({
    owner: params.owner!,
    repo: params.repo!,
    run_id: Number(params.id!),
    exclude_pull_requests: false,
  });

  return json({
    name: res.data.name!,
  });
};

export default function Action() {
  return <Outlet />;
}
