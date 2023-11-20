import type { DataFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getOctokit } from "~/octokit.server";
import { getLogs } from "./archive.server";
import { Details, useDetails } from "@primer/react";

export const loader = async ({ request, params }: DataFunctionArgs) => {
  const octokit = await getOctokit(request);

  console.log(params);
  const { owner, repo, id } = params;

  const attempt = await octokit.actions.getWorkflowRun({
    owner: owner!,
    repo: repo!,
    run_id: Number(id!),
  });

  const datum = attempt.data;

  console.log(datum.logs_url);

  const req = await octokit.request(datum.logs_url, {
    mediaType: {
      format: "raw",
    },
  });

  const logs: [string, string][] = getLogs(req.data as ArrayBuffer);

  return { logs: logs };
};

function Log({ name, data }: { name: string; data: string }) {
  const details = useDetails({});
  const errors = data
    .split("\n")
    .filter((line) => line.toLocaleLowerCase().includes("error"))
    .join("\n");

  return (
    <>
      <h4>{name}</h4>
      {errors.length ? (
        <Details {...details.getDetailsProps()}>
          <pre>
            <code>{errors}</code>
          </pre>
        </Details>
      ) : undefined}
    </>
  );
}

export default function Logs() {
  const { logs } = useLoaderData<typeof loader>();

  return (
    <div>
      Logs live here
      <br />
      <ul>
        {logs.map(([name, data]) => (
          <li key={name}>
            <Log name={name} data={data} />
          </li>
        ))}
      </ul>
    </div>
  );
}
