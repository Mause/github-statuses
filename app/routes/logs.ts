import { json } from "@remix-run/node";
import { SignalRSocket } from "~/signalr/signalr-socket";
import { w3cwebsocket } from "websocket";
import type { Params } from "@remix-run/react";

(globalThis as any).WebSocket = w3cwebsocket;

export async function loader({
  params,
}: {
  params: Params<"owner" | "repo" | "commit_hash" | "check_id">;
}) {
  const instance = SignalRSocket.getInstance("WatchRunStepsProgressAsync");
  instance.startOrContinueStreaming(
    `https://github.com/${params.owner}/${params.repo}/commit/${params.commit_hash}/checks/${params.check_id}/live_logs`
  );
  let _resolve: (arg0: Event) => void;
  const res = new Promise<Event>((resolve) => (_resolve = resolve));

  instance.addEventListener("socketDidReceiveMessage", (event) =>
    _resolve(event)
  );

  const seconds = 50;
  return json({
    hello: await Promise.race([
      res,
      sleep(seconds).then(() => ({ timedOut: `failed in ${seconds} seconds` })),
    ]),
  });
}

const sleep = (seconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, seconds * 1000));
