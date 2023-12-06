import { json } from "@remix-run/node";
import { getAppOctokit } from "../services/github-app-auth.server";
import { getUser, octokitFromToken } from "~/octokit.server";
import { sessionStorage } from "~/services/session.server";
import type { Octokit } from "@octokit/rest";

const INSTALLATION_ID = "installation_id";

export async function getInstallationOctokit(request: Request) {
  const appOctokit = await getAppOctokit();

  const installationId = await getInstallationId(request, appOctokit);
  if (!installationId) {
    throw json({
      error: "No installation found for this user",
    });
  }

  const installationAccessToken =
    await appOctokit.apps.createInstallationAccessToken({
      installation_id: installationId,
    });

  return octokitFromToken(installationAccessToken.data.token);
}

export async function getCachedInstallationId() {
  const session = await sessionStorage.getSession();

  return session.get(INSTALLATION_ID);
}

async function getInstallationId(
  request: Request,
  appOctokit: Octokit,
): Promise<number | undefined> {
  let installation_id = await getCachedInstallationId();
  if (installation_id) return installation_id;

  const user = await getUser(request);

  const { data: installations } = await appOctokit.apps.listInstallations();

  const installation = installations.find(
    (installation) => installation?.account?.login === user.login,
  );

  const session = await sessionStorage.getSession();
  if (installation) {
    session.set(INSTALLATION_ID, installation.id);
    await sessionStorage.commitSession(session);
    return installation.id;
  }
}