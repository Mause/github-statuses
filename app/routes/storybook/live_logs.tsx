import { defer } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { DataLoaderParams } from "~/components";
import LiveLogs, { getLiveLogs } from "~/components/LiveLogs";
export { ErrorBoundary } from "~/components";

type Keys = "repo" | "owner" | "commit_hash" | "check_id";

export async function loader({ request, params }: DataLoaderParams<Keys>) {
  const keys = ["repo", "owner", "commit_hash", "check_id"] as Keys[];

  const missing_keys = keys.filter((key) => !params[key]);

  if (missing_keys.length) {
    throw new Response(
      JSON.stringify({
        error: `Missing required keys: ${missing_keys.join(", ")}`,
      }),
      {
        status: 400,
        statusText: "Bad Request",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
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
