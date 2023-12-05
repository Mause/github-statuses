import {
  Strategy,
  type AuthenticateOptions,
  type StrategyVerifyCallback,
} from "remix-auth";
import type {
  GitHubExtraParams,
  GitHubProfile,
  GitHubStrategyOptions,
} from "remix-auth-github";
import { createAppAuth, createOAuthUserAuth } from "@octokit/auth-app";
import type { OAuth2StrategyVerifyParams } from "remix-auth-oauth2";
import type { WebFlowAuthOptions } from "@octokit/auth-oauth-app";
import type { SessionStorage, SessionData } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { randomBytes } from "crypto";
import createDebug from "debug";
import { octokitFromToken } from "~/octokit.server";
import _ from "lodash";

function checkNonNull(name: string): NonNullable<string> {
  const value = process.env[name];
  if (value == null) {
    throw new Error(`Expected ${name} to be non-null`);
  }
  return value;
}

export const appAuth = _.memoize(() =>
  createAppAuth({
    appId: checkNonNull("GITHUB_APP_ID"),
    clientId: checkNonNull("GITHUB_APP_CLIENT_ID"),
    clientSecret: checkNonNull("GITHUB_APP_CLIENT_SECRET"),
    privateKey: checkNonNull("GITHUB_APP_PRIVATE_KEY"),
  }),
);

export async function getAppOctokit() {
  return octokitFromToken(
    (
      await appAuth()({
        type: "app",
      })
    ).token,
  );
}

const debug = createDebug("remix-auth-github");

export class GitHubAppAuthStrategy<User> extends Strategy<
  User,
  OAuth2StrategyVerifyParams<GitHubProfile, GitHubExtraParams>
> {
  name = "github";
  sessionStateKey = "oauth2:state";
  authorizationURL = "https://github.com/login/oauth/authorize";
  tokenURL = "https://github.com/login/oauth/access_token";
  callbackURL: string;
  clientID: string;
  responseType: string;

  constructor(
    options: GitHubStrategyOptions,
    verify: StrategyVerifyCallback<
      User,
      OAuth2StrategyVerifyParams<GitHubProfile, GitHubExtraParams>
    >,
  ) {
    super(verify);
    this.responseType = "code";
    this.authorizationURL = options.authorizationURL ?? this.authorizationURL;
    this.clientID = options.clientID;
    this.callbackURL = options.callbackURL;
  }

  generateState(): string {
    return randomBytes(100).toString("base64url");
  }

  protected authorizationParams(params: URLSearchParams): URLSearchParams {
    return new URLSearchParams(params);
  }

  private getAuthorizationURL(request: Request, state: string) {
    let params = new URLSearchParams(
      this.authorizationParams(new URL(request.url).searchParams),
    );
    params.set("response_type", this.responseType);
    params.set("client_id", this.clientID);
    params.set("redirect_uri", this.getCallbackURL(request).toString());
    params.set("state", state);

    let url = new URL(this.authorizationURL);
    url.search = params.toString();

    return url;
  }

  private getCallbackURL(request: Request) {
    if (
      this.callbackURL.startsWith("http:") ||
      this.callbackURL.startsWith("https:")
    ) {
      return new URL(this.callbackURL);
    }
    let host =
      request.headers.get("X-Forwarded-Host") ??
      request.headers.get("host") ??
      new URL(request.url).host;
    let protocol = host.includes("localhost") ? "http" : "https";
    if (this.callbackURL.startsWith("/")) {
      return new URL(this.callbackURL, `${protocol}://${host}`);
    }
    return new URL(`${protocol}//${this.callbackURL}`);
  }

  async authenticate(
    request: Request,
    sessionStorage: SessionStorage<SessionData, SessionData>,
    options: AuthenticateOptions,
  ): Promise<User> {
    debug("Request URL", request.url);
    let url = new URL(request.url);
    let session = await sessionStorage.getSession(
      request.headers.get("Cookie"),
    );

    let user: User | null = session.get(options.sessionKey) ?? null;

    // User is already authenticated
    if (user) {
      debug("User is authenticated");
      return this.success(user, request, sessionStorage, options);
    }

    let callbackURL = this.getCallbackURL(request);

    debug("Callback URL", callbackURL);

    // Redirect the user to the callback URL
    if (url.pathname !== callbackURL.pathname) {
      debug("Redirecting to callback URL");
      let state = this.generateState();
      debug("State", state);
      session.set(this.sessionStateKey, state);
      throw redirect(this.getAuthorizationURL(request, state).toString(), {
        headers: { "Set-Cookie": await sessionStorage.commitSession(session) },
      });
    }

    // Validations of the callback URL params

    let stateUrl = url.searchParams.get("state");
    debug("State from URL", stateUrl);
    if (!stateUrl) {
      return await this.failure(
        "Missing state on URL.",
        request,
        sessionStorage,
        options,
        new Error("Missing state on URL."),
      );
    }

    let stateSession = session.get(this.sessionStateKey);
    debug("State from session", stateSession);
    if (!stateSession) {
      return await this.failure(
        "Missing state on session.",
        request,
        sessionStorage,
        options,
        new Error("Missing state on session."),
      );
    }

    if (stateSession === stateUrl) {
      debug("State is valid");
      session.unset(this.sessionStateKey);
    } else {
      return await this.failure(
        "State doesn't match.",
        request,
        sessionStorage,
        options,
        new Error("State doesn't match."),
      );
    }

    let code = url.searchParams.get("code");
    if (!code) {
      return await this.failure(
        "Missing code.",
        request,
        sessionStorage,
        options,
        new Error("Missing code."),
      );
    }

    try {
      // Get the access token

      let params = new URLSearchParams(this.tokenParams());
      params.set("grant_type", "authorization_code");
      params.set("redirect_uri", callbackURL.toString());

      let state = session.get(this.sessionStateKey);

      let { accessToken, refreshToken, extraParams } =
        await this.fetchAccessToken(code, state, params);

      // Get the profile
      let profile = await this.userProfile(accessToken, extraParams);

      // Verify the user and return it, or redirect

      user = await this.verify({
        accessToken,
        refreshToken: refreshToken!,
        extraParams,
        profile,
        context: options.context,
        request,
      });
    } catch (error) {
      debug("Failed to verify user", error);
      // Allow responses to pass-through
      if (error instanceof Response) throw error;
      if (error instanceof Error) {
        return await this.failure(
          error.message,
          request,
          sessionStorage,
          options,
          error,
        );
      }
      if (typeof error === "string") {
        return await this.failure(
          error,
          request,
          sessionStorage,
          options,
          new Error(error),
        );
      }
      return await this.failure(
        "Unknown error",
        request,
        sessionStorage,
        options,
        new Error(JSON.stringify(error, null, 2)),
      );
    }

    debug("User authenticated");
    return await this.success(user, request, sessionStorage, options);
  }
  userInfoURL = "https://api.github.com/user";

  protected async userProfile(
    accessToken: string,
    extraParams: GitHubExtraParams,
  ): Promise<GitHubProfile> {
    let response = await fetch(this.userInfoURL, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `token ${accessToken}`,
      },
    });

    let data: GitHubProfile["_json"] = await response.json();

    let emails: GitHubProfile["emails"] = [{ value: data.email }];

    let profile: GitHubProfile = {
      provider: "github",
      displayName: data.login,
      id: data.id.toString(),
      name: {
        familyName: data.name,
        givenName: data.name,
        middleName: data.name,
      },
      emails: emails,
      photos: [{ value: data.avatar_url }],
      _json: data,
    };

    return profile;
  }

  tokenParams(): URLSearchParams {
    return new URLSearchParams();
  }

  async fetchAccessToken(
    code: string,
    state: string,
    params: URLSearchParams,
  ): Promise<{
    accessToken: string;
    extraParams: GitHubExtraParams;
    refreshToken?: string;
  }> {
    const oo: WebFlowAuthOptions = {
      type: "oauth-user",
      code: code,
      redirectUrl: this.callbackURL,
      state,
    };
    const authentication = await appAuth()({
      ...oo,
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
