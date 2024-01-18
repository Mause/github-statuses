import { json } from "@remix-run/node";
import { getAppOctokit, getConfig } from "./github-app-auth.server";
import { getUser, octokitFromConfig } from "~/octokit.server";
import { sessionStorage } from "./session.server";
import type { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

const INSTALLATION_ID = "installation_id";

export async function getInstallationOctokit(request: Request) {
  const appOctokit = await getAppOctokit();

  const installationId = await getInstallationId(request, appOctokit);
  if (!installationId) {
    throw json({
      error: "No installation found for this user",
    });
  }

  const { auth, ...rest } = getConfig();
  return octokitFromConfig({
    authStrategy: createAppAuth,
    ...rest,
    auth: {
      ...auth,
      installationId,
    },
  });
}

async function getCachedInstallationId(request: Request) {
  const session = await sessionStorage.getSession(
    request.headers.get("Cookie"),
  );

  return session.get(INSTALLATION_ID);
}

export async function getInstallationId(
  request: Request,
  appOctokit: Octokit,
): Promise<number | undefined> {
  let installation_id = await getCachedInstallationId(request);
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
