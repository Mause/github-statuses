import { Octokit } from "@octokit/rest";
import { createAppAuth, StrategyOptions } from "@octokit/auth-app";

const auth: StrategyOptions = {
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_SECRET!,
  installationId: process.env.GITHUB_INSTALL_ID,
};
export const octokit = new Octokit({
  authStrategy: createAppAuth,
  auth,
});
