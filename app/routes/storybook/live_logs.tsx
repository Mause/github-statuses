import type { LoaderFunction } from "@remix-run/node";
import { defer } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import LiveLogs, { getLiveLogs } from "~/components/LiveLogs";
export { ErrorBoundary } from "~/components";

export const loader: LoaderFunction = async ({ request }) => {
  const keys = ["repo", "owner", "commit_hash", "check_id"];

  const params = new URL(request.url).searchParams;
  const missing_keys = keys.filter((key) => !params.get(key));

  if (missing_keys.length) {
    throw new Response(
      JSON.stringify({
        error: "Missing required keys",
        missing_keys,
      }),
      {
        status: 400,
        statusText: "Bad Request",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  console.log("params", params);

  return defer({
    logStreamWebSocketUrl: getLiveLogs(request, {
      check_id: Number(params.get("check_id")!),
      commit_hash: params.get("commit_hash")!,
      owner: params.get("owner")!,
      repo: params.get("repo")!,
    }),
  });
};

export default function LiveLogsDemo() {
  const { logStreamWebSocketUrl } = useLoaderData<typeof loader>();

  return <LiveLogs live_logs={logStreamWebSocketUrl} />;
}
