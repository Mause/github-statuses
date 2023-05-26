import { defer } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { DataLoaderParams } from "~/components";
import LiveLogs, { getLiveLogs } from "~/components/LiveLogs";
export { ErrorBoundary } from "~/components";

type Keys = "repo" | "owner" | "commit_hash" | "check_id";

export async function loader({ request, params }: DataLoaderParams<Keys>) {
  for (const key of ["repo", "owner", "commit_hash", "check_id"] as Keys[]) {
    if (!params[key]) {
      throw new Error(`Missing required parameter: ${key}`);
    }
  }

  return defer({
    logStreamWebSocketUrl: getLiveLogs(request, {
      check_id: Number(params.check_id!),
      commit_hash: params.commit_hash!,
      owner: params.owner!,
      repo: params.repo!,
    }),
  });
}

export default function LiveLogsDemo() {
  const { logStreamWebSocketUrl } = useLoaderData<typeof loader>();

  return <LiveLogs live_logs={logStreamWebSocketUrl} />;
}
