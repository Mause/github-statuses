import { getOctokit } from "~/octokit.server";
import { Suspense, useEffect, useState } from "react";
import { Await } from "@remix-run/react";
import { useAsyncError } from "react-router";

interface LiveLogsResponse {
  success: boolean;
  errors: string[];
  data: {
    authenticated_url: string;
  };
}

export async function getLiveLogs(
  request: Request,
  args: { repo: string; owner: string; commit_hash: string; check_id: Number }
) {
  console.log("getLiveLogs", args);
  let octokit;
  try {
    octokit = await getOctokit(request);
  } catch (e) {
    throw { error: "not logged in" };
  }
  console.log("octokit got");

  const live_logs = await octokit.request<LiveLogsResponse>({
    url: `https://github.com/${args.owner}/${args.repo}/commit/${args.commit_hash}/checks/${args.check_id}/live_logs`,
  });
  console.log("live_logs", live_logs);
  if (!live_logs.data.success) {
    throw new Error(live_logs.data.errors.join("\n"));
  }

  const authed_url = await octokit.request<{ logStreamWebSocketUrl: string }>({
    url: live_logs.data.data.authenticated_url,
  });
  console.log("authed_url", authed_url);

  return authed_url.data.logStreamWebSocketUrl;
}

function Childe() {
  const error = useAsyncError();

  if (error instanceof Error) {
    return (
      <div>
        error:{" "}
        {JSON.stringify({
          message: error.message,
          name: error.name,
          stack: error.stack,
        })}
      </div>
    );
  } else {
    return <div>mebe error: {JSON.stringify(error)}</div>;
  }
}

export default function LiveLogs({
  live_logs,
}: {
  live_logs: Promise<string>;
}) {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <Await resolve={live_logs} errorElement={<Childe />}>
          {(defer) => <RenderLogs live_logs={defer} />}
        </Await>
      </Suspense>
    </div>
  );
}

function useLogs(url: string) {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    const stream = new WebSocket(url);

    stream.onopen = () => {
      console.log("connected");
      stream.send(
        JSON.stringify({
          type: "subscribe",
          data: { job_id: 17618, type: "logs" },
        })
      );
    };

    stream.onmessage = (event) => {
      // append to messages state array
      console.log("message received", event.data);
      setLogs((logs) => logs.concat([event.data]));
    };

    stream.onclose = () => {
      console.log("closed");
    };

    stream.onerror = (err) => {
      console.log("error", err);
    };

    return () => stream.close();
  }, [url]);

  return logs;
}

function RenderLogs({ live_logs }: { live_logs: string }) {
  const logs = useLogs(live_logs);

  return (
    <div>
      URL: {live_logs}
      <br />
      <code>
        <pre>{logs.join("\n")}</pre>
      </code>
    </div>
  );
}
