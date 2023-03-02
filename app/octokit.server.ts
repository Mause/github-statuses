import { Octokit } from "@octokit/rest";
import type { StrategyOptions } from "@octokit/auth-app";
import { createAppAuth } from "@octokit/auth-app";
import { throttling } from "@octokit/plugin-throttling";

import { GitHubStrategy } from "remix-auth-github";

const auth: StrategyOptions = {
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_SECRET!,
  installationId: process.env.GITHUB_INSTALL_ID,
};

const Throttled = Octokit.plugin(throttling);

interface Request {
  method: string;
  url: string;
}

export const octokit = new Throttled({
  authStrategy: createAppAuth,
  auth,
  throttle: {
    onRateLimit: (
      retryAfter: number,
      options: Request,
      octokit: Octokit,
      retryCount: number
    ) => {
      octokit.log.warn(
        `Request quota exhausted for request ${options.method} ${options.url}`
      );

      if (retryCount < 1) {
        // only retries once
        octokit.log.info(`Retrying after ${retryAfter} seconds!`);
        return true;
      }
    },
    onSecondaryRateLimit: (
      retryAfter: any,
      options: { method: any; url: any },
      octokit: Octokit
    ) => {
      // does not retry, only logs a warning
      octokit.log.warn(
        `SecondaryRateLimit detected for request ${options.method} ${options.url}`
      );
    },
  },
});

let gitHubStrategy = new GitHubStrategy(
  {
    clientID: "YOUR_CLIENT_ID",
    clientSecret: "YOUR_CLIENT_SECRET",
    callbackURL: "https://example.com/auth/github/callback",
  },
  async ({ accessToken, extraParams, profile }) => {
    // Get the user data from your DB or API using the tokens and profile
    return User.findOrCreate({ email: profile.emails[0].value });
  }
);

authenticator.use(gitHubStrategy);
