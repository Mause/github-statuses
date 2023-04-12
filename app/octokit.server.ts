import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import type { SessionShape } from "~/services/auth.server";
import { authenticator } from "~/services/auth.server";
import { GitHubStrategy } from "remix-auth-github";
import type { DataFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/router";
import { createVerifier } from "fast-jwt";
import type { TypedDocumentString } from "./components/graphql/graphql";
import type { RequestParameters } from "@octokit/auth-app/dist-types/types";

const Throttled = Octokit.plugin(throttling);

type Request = DataFunctionArgs["request"];

export async function getUserNoRedirect(
  request: Request
): Promise<SessionShape | null> {
  const session = await authenticator().isAuthenticated(request);
  if (session) createVerifier({})(session.accessToken);
  return session;
}

export async function getUser(request: Request): Promise<SessionShape> {
  const user = await getUserNoRedirect(request);
  if (!user) throw redirect("/login");
  return user;
}

export const getOctokit = async (request: DataFunctionArgs["request"]) => {
  const user = await getUser(request);
  return octokitFromToken(user.accessToken);
};

export const octokitFromToken = (token: string) =>
  new Throttled({
    auth: token,
    previews: ["merge-info"],
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
    async ({ accessToken, extraParams, profile }) => {
      const octokit = octokitFromToken(accessToken);
      // Get the user data from your DB or API using the tokens and profile
      return Object.assign((await octokit.rest.users.getAuthenticated()).data, {
        accessToken,
      });
    }
  );
};

export async function call<Result, Variables extends RequestParameters>(
  octokit: Octokit,
  query: TypedDocumentString<Result, Variables>,
  variables?: Variables,
  fragments?: TypedDocumentString<any, any>[]
): Promise<Result> {
  return await octokit.graphql(
    [query.toString(), ...(fragments || [])].join("\n"),
    variables
  );
}
