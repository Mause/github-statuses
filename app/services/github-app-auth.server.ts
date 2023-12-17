import type { GitHubExtraParams } from "remix-auth-github";
import { createAppAuth, createOAuthUserAuth } from "@octokit/auth-app";
import { octokitFromConfig } from "~/octokit.server";
import _ from "lodash";
import getCache from "~/services/cache";
import { GitHubStrategy } from "remix-auth-github";
import { urlWithRedirectUrl } from "~/components/queryParams";

function checkNonNull(name: string): NonNullable<string> {
  const value = process.env[name];
  if (value == null) {
    throw new Error(`Expected ${name} to be non-null`);
  }
  return value;
}

export const appAuth = _.memoize(() => createAppAuth(getAuthConfig()));

export const getConfig = _.memoize(() => {
  return {
    auth: getAuthConfig(),
    log: {
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      log: console.log.bind(console),
      debug: () => {},
      info: console.info.bind(console),
    },
    cache: getCache(),
  };
});

function getAuthConfig() {
  return {
    appId: checkNonNull("GITHUB_APP_ID"),
    clientId: checkNonNull("GITHUB_APP_CLIENT_ID"),
    clientSecret: checkNonNull("GITHUB_APP_CLIENT_SECRET"),
    privateKey: checkNonNull("GITHUB_APP_PRIVATE_KEY"),
    log: {
      error: console.error.bind(console),
      warn: console.warn.bind(console),
      log: console.log.bind(console),
      debug: () => {},
      info: console.info.bind(console),
    },
    cache: getCache(),
  };
}

export async function getAppOctokit() {
  return octokitFromConfig({
    authStrategy: createAppAuth,
    ...getConfig(),
  });
}

export class GitHubAppAuthStrategy<User> extends GitHubStrategy<User> {
  async fetchAccessToken(
    code: string,
    params: URLSearchParams,
  ): Promise<{
    accessToken: string;
    extraParams: GitHubExtraParams;
    refreshToken: string;
  }> {
    const authentication = await appAuth()({
      type: "oauth-user",
      code: code,
      redirectUrl: urlWithRedirectUrl(this.callbackURL, params),
      factory: createOAuthUserAuth,
    });

    console.log("calling authentication");
    let token;
    try {
      token = await authentication();
    } catch (e) {
      console.error(e);
      throw e;
    }
    console.log("called authentication", Object.keys(token));

    if (!("expiresAt" in token)) {
      throw new Error("invalid response from GitHub");
    }

    return {
      accessToken: token.token,
      refreshToken: token.refreshToken,
      extraParams: {
        tokenType: token.tokenType,
        accessTokenExpiresIn: Date.now() - Date.parse(token.expiresAt),
        refreshTokenExpiresIn:
          Date.now() - Date.parse(token.refreshTokenExpiresAt),
      },
    };
  }
}
