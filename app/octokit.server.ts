import { Octokit } from "@octokit/rest";
import type { StrategyOptions } from "@octokit/auth-app";
import { throttling } from "@octokit/plugin-throttling";
import { authenticator } from "~/services/auth.server";
import { GitHubStrategy } from "remix-auth-github";
import type { DataFunctionArgs } from "@remix-run/node";
import { getSession } from "./services/session.server";

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

export const getOctokit = async (request: DataFunctionArgs["request"]) => {
  const session = await getSession(request.headers.get("cookie"));
  const user = session.get("user");
  console.log(session.data);
  return octokitFromToken(user.accessToken);
};

export const octokitFromToken = (token: string) =>
  new Throttled({
    auth: token,
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

const port = process.env.PORT || 3000;
const rootURL = (() => {
  switch (process.env.VERCEL_ENV) {
    case "development":
      return `https://${port}-${process.env.HOSTNAME}.ws-us89.gitpod.io`;
    case "preview":
      return `https://${process.env.VERCEL_URL}`;
    case "production":
      return "https://actions.vc.mause.me";
    default:
      return `http://localhost:${port}`;
  }
})();

console.log("running with", { rootURL });

let gitHubStrategy = new GitHubStrategy(
  {
    clientID: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_SECRET!,
    callbackURL: `${rootURL}/auth/github/callback`,
    scope: ["user", "read:user"],
  },
  async ({ accessToken, extraParams, profile }) => {
    const octokit = octokitFromToken(accessToken);
    // Get the user data from your DB or API using the tokens and profile
    return Object.assign((await octokit.rest.users.getAuthenticated()).data, {
      accessToken,
    });
  }
);

authenticator.use(gitHubStrategy);
