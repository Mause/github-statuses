import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Octokit } from "@octokit/rest";
import type { LoaderArgs } from "@remix-run/node";

const octokit = new Octokit();

export const loader = async ({ params }: LoaderArgs) => {
  const pr = await octokit.rest.pulls.get(params);
  const statuses = (await octokit.rest.checks.listForRef({
    ...params,
    ref: pr.data.head.sha
  })).data.check_runs.filter(status => status.conclusion !== 'success');
  console.log(statuses);

  return json({statuses});
};

export default function Index() {
  const { statuses } = useLoaderData<typeof loader>();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix</h1>
      <ul>
        <li>
          <a
            target="_blank"
            href="https://remix.run/tutorials/blog"
            rel="noreferrer"
          >
            15m Quickstart Blog Tutorial
          </a>
        </li>
        <li>
          <a
            target="_blank"
            href="https://remix.run/tutorials/jokes"
            rel="noreferrer"
          >
            Deep Dive Jokes App Tutorial
          </a>
        </li>
        <li>
            Statuses: { statuses.length }
        </li>
      </ul>
    </div>
  );
}

