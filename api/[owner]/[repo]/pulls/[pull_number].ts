import { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from "@octokit/rest";

const octokit = new Octokit();

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const pr = await octokit.rest.pulls.get(request.query);
  const statuses = (await octokit.rest.checks.listForRef({
    ...request.query,
    ref: pr.data.head.sha
  })).data;
  statuses = statuses.check_runs.filter(status => status.conclusion !== 'success');
  console.log(statuses);

  response.status(200).json({
    body: request.body,
    query: request.query,
    cookies: request.cookies,
    statuses,
  });
}
