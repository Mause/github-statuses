import { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from "@octokit/rest";

const octokit = new Octokit();

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const pr = await octokit.rest.pulls.get(request.query);
  console.log(Object.keys(pr.data));
  const statuses = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}/statuses', {
    ...request.query,
    ref: pr.data.head.sha
  });
  console.log(statuses.data);

  response.status(200).json({
    body: request.body,
    query: request.query,
    cookies: request.cookies,
    statuses: statuses.data,
  });
}
