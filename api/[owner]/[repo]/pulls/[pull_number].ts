import { NextApiRequest, NextApiResponse } from 'next';
import { Octokit } from "@octokit/core";

const octokit = new Octokit();

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  const pr = await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', request.query)
  const statuses = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}/statuses', {
    ...request.query,
    ref: pr.head.sha
  });

  response.status(200).json({
    body: request.body,
    query: request.query,
    cookies: request.cookies,
    statuses,
  });
}
