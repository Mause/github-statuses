import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { getAppOctokit } from "../services/github-auth-auth.server";
import { getUser, octokitFromToken } from "~/octokit.server";
import { sessionStorage } from "~/services/session.server";
import type { Octokit } from "@octokit/rest";
import _ from "lodash";
import AdmZip from "adm-zip";
import { extractName } from "./$owner/$repo/actions/$id/logs";

const INSTALLATION_ID = "installation_id";

export const loader = async ({ request }: DataFunctionArgs) => {
  const appOctokit = await getAppOctokit();

  const installationId = await getInstallationId(request, appOctokit);
  if (!installationId) {
    return json({
      error: "No installation found for this user",
    });
  }

  const installationAccessToken =
    await appOctokit.apps.createInstallationAccessToken({
      installation_id: installationId,
    });

  const installationOctokit = octokitFromToken(
    installationAccessToken.data.token,
  );

  const workflowRuns =
    await installationOctokit.actions.listWorkflowRunsForRepo({
      owner: "Mause",
      repo: "duckdb",
    });
  const { workflow_runs } = workflowRuns.data;
  const workflow_run =
    workflow_runs.find((run) => run.name === "Windows") || workflow_runs[0];

  const log_zip = await installationOctokit.request({
    url: workflow_run.logs_url,
    mediaType: {
      format: "raw",
    },
  });

  const zip = new AdmZip(Buffer.from(log_zip.data as ArrayBuffer));

  const entries = _.groupBy(
    zip
      .getEntries()
      .filter((entry) => !entry.isDirectory && entry.entryName.includes("/")),
    (entry) => entry.entryName.split("/")[0],
  );

  const logs = _.map(entries, (entries, job) => [job, processEntries(entries)]);
  return json({
    installationAccessToken: installationAccessToken.data,
    log_zip: logs,
  });

  function processEntries(entries: AdmZip.IZipEntry[]) {
    return _.chain(entries)
      .map((entry) => {
        const name = entry.name;
        const parts = name.split("_");
        return {
          name: extractName(name),
          filename: name,
          index: Number(parts[0]),
          contents: entry.getData().toString(),
        };
      })
      .sortBy((entry) => entry.index)
      .value();
  }
};

async function getInstallationId(
  request: Request,
  appOctokit: Octokit,
): Promise<number | undefined> {
  const user = await getUser(request);

  const session = await sessionStorage.getSession();

  const installation_id = session.get(INSTALLATION_ID);
  if (installation_id) return installation_id;

  const { data: installations } = await appOctokit.apps.listInstallations();

  const installation = installations.find(
    (installation) => installation?.account?.login === user.login,
  );

  if (installation) {
    session.set(INSTALLATION_ID, installation.id);
    await sessionStorage.commitSession(session);
    return installation.id;
  }
}
