import { octokit } from "../../../../octokit.server";
import { memoize } from "async";

const _getWorkflowName = memoize(
  async function (
    owner: string,
    repo: string,
    run_id: number
  ): Promise<string> {
    const workflow_run = await octokit.rest.actions.getWorkflowRun({
      run_id,
      owner,
      repo,
    });

    const { name } = workflow_run.data;

    return name!;
  },
  (...args: any[]) => args.join("-")
);
export async function getWorkflowName(...args: any[]): Promise<string> {
  return await new Promise(async (resolve, reject) => {
    await _getWorkflowName(...args, (err: Error | null, result: string) =>
      err ? reject(err) : resolve(result)
    );
  });
}
