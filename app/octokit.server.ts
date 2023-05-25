import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import type { SessionShape } from "~/services/auth.server";
import { authenticator } from "~/services/auth.server";
import type {
  GitHubExtraParams,
  GitHubProfile,
  GitHubStrategyOptions} from "remix-auth-github";
import {
  GitHubStrategy
} from "remix-auth-github";
import type { DataFunctionArgs, SessionStorage } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import type { TypedDocumentString } from "./components/graphql/graphql";
import type { RequestParameters } from "@octokit/auth-app/dist-types/types";
import * as Sentry from "@sentry/remix";
import { RequestError } from "@octokit/request-error";
import type { AuthenticateOptions, StrategyVerifyCallback } from "remix-auth";
import * as sessionStorage from "./services/session.server";
import _ from "lodash";
import type { OAuth2StrategyVerifyParams } from "remix-auth-oauth2";

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
        options: any,
        octokit: any,
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
      onSecondaryRateLimit: (retryAfter: any, options: any, octokit: any) => {
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

export async function isAuthenticated(
  request: Request,
  options:
    | { successRedirect?: undefined; failureRedirect?: undefined }
    | undefined
) {
  const authe = authenticator();
  const user = await authe.isAuthenticated(request, options);
  if (user?.accessTokenExpiry) {
    const expired = Date.now() > user.accessTokenExpiry;
    if (expired)
      gitHubStrategy().updateToken(request, user, sessionStorage, {
        ...options,
        sessionKey: authe.sessionKey,
        sessionErrorKey: authe.sessionErrorKey,
        sessionStrategyKey: authe.sessionStrategyKey,
        name: "",
      });
  }
  return user;
}

export class XGitHubStrategy extends GitHubStrategy<SessionShape> {
  constructor(
    options: GitHubStrategyOptions,
    verify: StrategyVerifyCallback<
      SessionShape,
      OAuth2StrategyVerifyParams<GitHubProfile, GitHubExtraParams>
    >
  ) {
    super(options, verify);
  }

  public async updateToken(
    request: Request,
    user: { refreshToken: string },
    sessionStorage: SessionStorage,
    options: AuthenticateOptions
  ) {
    // fetch the refreshed token and user data
    const params = new URLSearchParams(this.tokenParams());
    params.set("client_id", this.clientID);
    params.set("client_secret", this.clientSecret);
    params.set("grant_type", "refresh_token");
    params.set("refresh_token", user.refreshToken);
    const response = await fetch(this.tokenURL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
    if (!response.ok) {
      // happens e.g. if the refresh token has expired, too
      throw await this.forceReLogin(request, sessionStorage, options);
    }

    // create new user object with updated data
    const { accessToken, refreshToken, extraParams } =
      await this.getAccessToken(response.clone());
    const profile = await this.userProfile(accessToken);
    try {
      user = await this.verify({
        accessToken,
        refreshToken,
        extraParams,
        profile,
      });
    } catch (error) {
      throw await this.forceReLogin(request, sessionStorage, options);
    }

    // save new data in session
    const session = await sessionStorage.getSession(
      request.headers.get("Cookie")
    );
    session.set(options.sessionKey, user);
    throw redirect(request.url, {
      headers: {
        "Set-Cookie": await sessionStorage.commitSession(session),
      },
    });
  }

  async forceReLogin(
    request: Request,
    sessionStorage: SessionStorage,
    options: AuthenticateOptions
  ) {
    const session = await sessionStorage.getSession(
      request.headers.get("Cookie")
    );
    session.unset(options.sessionKey);
    throw redirect(request.url, {
      headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
    });
  }
}

export const gitHubStrategy = _.memoize(() => {
  const callbackURL = `${getRootURL()}/auth/github/callback`;
  console.log({ callbackURL });

  return new XGitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
      callbackURL,
      scope: ["user", "read:user"],
    },
    async ({ accessToken, profile, extraParams, refreshToken }) => {
      console.log({ extraParams });
      return {
        login: profile._json.login,
        accessToken,
        refreshToken,
        accessTokenExpiry: extraParams.accessTokenExpiresIn
          ? Date.now() + extraParams.accessTokenExpiresIn
          : null,
      };
    }
  );
});

export async function call<Result, Variables extends RequestParameters>(
  request: Request,
  query: TypedDocumentString<Result, Variables>,
  variables?: Variables,
  fragments?: TypedDocumentString<any, any>[]
): Promise<Result> {
  const octokit = await getOctokit(request);

  const match = /query ([^ ]?)/.exec(query.toString());
  const transaction = Sentry.startTransaction({
    op: "graphql",
    name:
      (match ? match[1] : undefined) ?? query.__meta__!.hash! ?? "unknown name",
  });

  try {
    return await octokit.graphql(
      [query.toString(), ...(fragments || [])].join("\n"),
      variables
    );
  } catch (e) {
    console.error(e);
    if (e instanceof RequestError) {
      if (e.message === "Bad credentials") {
        await authenticator().logout(request, {
          redirectTo: "/",
        });
      }
    }
    throw e;
  } finally {
    transaction.finish();
  }
}
