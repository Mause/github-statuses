import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import type { SessionShape } from "~/services/auth.server";
import { authenticator } from "~/services/auth.server";
import { GitHubStrategy } from "remix-auth-github";
import type { DataFunctionArgs } from "@remix-run/node";
import type { TypedDocumentString } from "./components/graphql/graphql";
import type { RequestParameters } from "@octokit/auth-app/dist-types/types";
import Sentry from "@sentry/node";

const Throttled = Octokit.plugin(throttling);

type Request = DataFunctionArgs["request"];

export async function getUser(request: Request): Promise<SessionShape> {
  return await authenticator().isAuthenticated(request, {
    failureRedirect: "/login",
  });
}

export const getOctokit = async (request: DataFunctionArgs["request"]) => {
  const user = await getUser(request);
  return octokitFromToken(user.accessToken);
};

export async function tryGetOctokit(request: DataFunctionArgs["request"]) {
  try {
    return await getOctokit(request);
  } catch (e) {
    return new Octokit();
  }
}

const SECOND = 1000;

export const octokitFromToken = (token: string) =>
  new Throttled({
    auth: token,
    previews: ["merge-info"],
    request: {
      timeout: 7 * SECOND,
    },
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

export function getRootURL() {
  const port = process.env.PORT || 3000;
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
}

export const gitHubStrategy = () => {
  const callbackURL = `${getRootURL()}/auth/github/callback`;
  console.log({ callbackURL });

  return new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      callbackURL,
      scope: ["user", "read:user"],
    },
    async ({ accessToken, profile }) => {
      return { login: profile._json.login, accessToken };
    }
  );
};

export async function call<Result, Variables extends RequestParameters>(
  octokit: Octokit,
  query: TypedDocumentString<Result, Variables>,
  variables?: Variables,
  fragments?: TypedDocumentString<any, any>[]
): Promise<Result> {
  const match = /query [^ ]?/.exec(query.toString());
  const transaction = Sentry.startTransaction({
    op: "graphql",
    name: (query.length && query[0]) ?? query.__meta__!.hash! ?? "unknown name",
  });

  try {
    return await octokit.graphql(
      [query.toString(), ...(fragments || [])].join("\n"),
      variables
    );
  } finally {
    transaction.finish();
  }
}
