import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import type { SessionShape } from "~/services/auth.server";
import { DUMMY_TOKEN, authenticator } from "~/services/auth.server";
import type { Request as RemixRequest } from "@remix-run/node";
import type { TypedDocumentString } from "./components/graphql/graphql";
import type { RequestParameters } from "@octokit/auth-app/dist-types/types";
import * as Sentry from "@sentry/remix";
import { RequestError } from "@octokit/request-error";
import { GitHubAppAuthStrategy } from "./services/github-app-auth.server";

const Throttled = Octokit.plugin(throttling);

type NodeRequest = globalThis.Request;
export type Requests = RemixRequest | NodeRequest;

const toNodeRequest = (input: Requests): NodeRequest =>
  input as unknown as NodeRequest;

export async function getUser(request: Requests): Promise<SessionShape> {
  return await authenticator().isAuthenticated(toNodeRequest(request), {
    failureRedirect: "/login",
  });
}

export const getOctokit = async (request: Requests) => {
  const user = await getUser(request);
  if (user.accessToken === DUMMY_TOKEN) {
    throw new Error("Please add dev access token to .env");
  }
  return octokitFromToken(user.accessToken);
};

export async function tryGetOctokit(request: Requests) {
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
        options: any,
        octokit: any,
        retryCount: number,
      ) => {
        octokit.log.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`,
        );

        if (retryCount < 1) {
          // only retries once
          octokit.log.info(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
      },
      onSecondaryRateLimit: (retryAfter: any, options: any, octokit: any) => {
        // does not retry, only logs a warning
        octokit.log.warn(
          `SecondaryRateLimit detected for request ${options.method} ${options.url}`,
        );
      },
    },
  });

export function getRootURL() {
  const port = process.env.PORT || 3000;
  switch (process.env.VERCEL_ENV) {
    case "preview":
      return `https://${process.env.VERCEL_URL}`;
    case "production":
      return "https://actions.vc.mause.me";
    case "development":
      if (process.env.GITPOD_WORKSPACE_ID) {
        return `https://${port}-${process.env.GITPOD_WORKSPACE_ID}.ws-us89.gitpod.io`;
      }
    default:
      return `http://localhost:${port}`;
  }
}

export const gitHubStrategy = () => {
  const callbackURL = `${getRootURL()}/auth/github/callback`;

  return new GitHubAppAuthStrategy(
    {
      clientID: process.env.GITHUB_APP_CLIENT_ID!,
      clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!,
      callbackURL,
      scope: ["user", "read:user"],
    },
    async ({ accessToken, profile, extraParams, refreshToken }) => {
      console.log({ extraParams });
      return {
        login: profile._json.login,
        accessToken,
        refreshToken,
        accessTokenExpiry: extraParams.accessTokenExpiresAt,
        refreshTokenExpiry: extraParams.refreshTokenExpiresAt,
      };
    },
  );
};

export async function call<Result, Variables extends RequestParameters>(
  request: Requests,
  query: TypedDocumentString<Result, Variables>,
  variables?: Variables,
  fragments?: TypedDocumentString<any, any>[],
): Promise<Result> {
  const octokit = await getOctokit(toNodeRequest(request));

  const match = /query ([^ ]?)/.exec(query.toString());
  const transaction = Sentry.startTransaction({
    op: "graphql",
    name:
      (match ? match[1] : undefined) ?? query.__meta__!.hash! ?? "unknown name",
  });

  try {
    return await octokit.graphql(
      [query.toString(), ...(fragments || [])].join("\n"),
      variables,
    );
  } catch (e) {
    console.error(e);
    if (e instanceof RequestError) {
      if (e.message === "Bad credentials") {
        await authenticator().logout(toNodeRequest(request), {
          redirectTo: "/",
        });
      }
    }
    throw e;
  } finally {
    transaction.finish();
  }
}
