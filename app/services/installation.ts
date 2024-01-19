import { json } from "@remix-run/node";
import { getAppOctokit, getConfig } from "./github-app-auth.server";
import { getUser, octokitFromConfig } from "~/octokit.server";
import { createAppAuth } from "@octokit/auth-app";

export async function getInstallationOctokit(request: Request) {
  const installationId = await getInstallationId(request);

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

export async function getInstallationId(
  request: Request,
): Promise<number | undefined> {
  const { installationId } = await getUser(request);
  if (!installationId) {
    throw json({
      error: "No installation found for this user",
    });
  }
  return installationId;
}

export async function getInstallationForLogin(user: { login: string }) {
  const appOctokit = await getAppOctokit();
  const { data: installation } = await appOctokit.apps.getUserInstallation({
    username: user.login,
  });

  return installation?.id;
}
