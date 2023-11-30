import { Button, FormControl, TextInput } from "@primer/react";
import type { ActionFunction } from "@remix-run/node";
import { defer } from "@remix-run/node";
import { useActionData, useFetcher } from "@remix-run/react";
import LiveLogs, { getLiveLogs, jsonResponse } from "~/components/LiveLogs";
export { ErrorBoundary } from "~/components";

export const action: ActionFunction = async ({ request }) => {
  const keys = ["repo", "owner", "commit_hash", "check_id"];

  const params = await request.formData();
  const missing_keys = keys.filter((key) => !params.get(key));

  if (missing_keys.length) {
    throw jsonResponse({
      error: "Missing required keys",
      missing_keys,
    });
  }

  console.log("params", params);

  return defer({
    logStreamWebSocketUrl: getLiveLogs(request, {
      check_id: Number(params.get("check_id")!),
      commit_hash: assertIsString(params.get("commit_hash")!),
      owner: assertIsString(params.get("owner")!),
      repo: assertIsString(params.get("repo")!),
    }),
  });
};

export default function LiveLogsDemo() {
  const fetcher = useFetcher();
  const actionData = useActionData<typeof action>();

  return (
    <>
      <fetcher.Form method="post">
        <FormControl>
          <FormControl.Label>Owner</FormControl.Label>
          <TextInput name="owner" defaultValue="Mause" />
        </FormControl>
        <FormControl>
          <FormControl.Label>Repo</FormControl.Label>
          <TextInput name="repo" defaultValue="duckdb" />
        </FormControl>
        <FormControl>
          <FormControl.Label>Commit hash</FormControl.Label>
          <TextInput
            min={40}
            max={40}
            name="commit_hash"
            defaultValue="4be846da025163df169ab4133ba65bc60a4ea2ff"
          />
        </FormControl>
        <FormControl>
          <FormControl.Label>Check ID</FormControl.Label>
          <TextInput
            type="numeric"
            name="check_id"
            defaultValue="19165872579"
          />
        </FormControl>
        <Button type="submit" disabled={fetcher.state !== "idle"}>
          Submit
        </Button>
      </fetcher.Form>
      {actionData?.logStreamWebSocketUrl ? (
        <LiveLogs live_logs={actionData.logStreamWebSocketUrl} />
      ) : (
        "No logs yet, fill out the form and submit"
      )}
    </>
  );
}

function assertIsString(value: FormDataEntryValue): string {
  if (typeof value !== "string") {
    throw new Error("Expected string: " + value);
  }
  return value;
}
