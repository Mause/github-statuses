import { Octokit } from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import type { SessionShape } from "~/services/auth.server";
import { authenticator } from "~/services/auth.server";
import { redirect, createCookie } from "@remix-run/node";
import type { TypedDocumentString } from "./components/graphql/graphql";
import type { RequestParameters } from "@octokit/auth-app/dist-types/types";
import * as Sentry from "@sentry/remix";
import { RequestError } from "@octokit/request-error";
import { GitHubAppAuthStrategy } from "./services/github-app-auth.server";
import { getInstallationForLogin } from "~/services/installation";

const Throttled = Octokit.plugin(throttling);

type NodeRequest = globalThis.Request;
export type Requests = NodeRequest;

const toNodeRequest = (input: Requests): NodeRequest =>
  input as unknown as NodeRequest;

export const redirectCookie = createCookie("redirect", {
  maxAge: 60 * 30, // half an hour
});

export async function getUser(request: Requests): Promise<SessionShape> {
  const res = await authenticator().isAuthenticated(toNodeRequest(request), {});
  if (!res) {
    const set_cookie = await redirectCookie.serialize(request.url);
    throw redirect("/login", {
      headers: {
        "Set-Cookie": set_cookie,
      },
    });
  }
  return res;
}

export async function getRedirect(request: Request): Promise<string> {
  const cookieHeader = request.headers.get("Cookie");
  return (await redirectCookie.parse(cookieHeader)) || "/";
}

export const getOctokit = async (request: Request) => {
  const user = await getUser(request);
  return octokitFromToken(user.accessToken);
};

export async function tryGetOctokit(request: Request) {
  try {
    return await getOctokit(request);
  } catch (e) {
    return new Octokit();
  }
}

const SECOND = 1000;

export const octokitFromToken = (token: string) =>
  octokitFromConfig({ auth: token });

export const octokitFromConfig = (
  config: Partial<ConstructorParameters<typeof Throttled>[0]>,
) =>
  new Throttled({
    ...config,
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
      const installationId = await getInstallationForLogin(profile._json);
      console.log({ extraParams });
      return {
        login: profile._json.login,
        installationId,
        accessToken,
        refreshToken,
        accessTokenExpiry: extraParams.accessTokenExpiresAt,
        refreshTokenExpiry: extraParams.refreshTokenExpiresAt,
      };
    },
  );
};

export async function call<Result, Variables extends RequestParameters>(
  request: Request,
  query: TypedDocumentString<Result, Variables>,
  variables?: Variables,
  fragments?: TypedDocumentString<any, any>[],
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
      variables,
    );
  } catch (e) {
    console.error(e);
    if (e instanceof RequestError) {
      if (e.message === "Bad credentials") {
        await authenticator().logout(request, {
          redirectTo: "/",
        });
      } else {
        console.log("Not a bad credentials error", e);
      }
    } else {
      console.log("Not a request error", e);
    }
    throw e;
  } finally {
    transaction.finish();
  }
}
