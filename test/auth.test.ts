import type { Session, SessionStorage } from "@remix-run/node";
import { GitHubAppAuthStrategy } from "~/services/github-app-auth.server";
import type { RequestInterface } from "@octokit/types";
import type { AuthenticateOptions } from "remix-auth";
import _ from "lodash";

const sessionKey = "oauth2:session";
const sessionStateKey = "oauth2:state";
const options: AuthenticateOptions = {
  sessionKey,
  sessionErrorKey: "sessionErrorKey",
  sessionStrategyKey: "sessionStrategyKey",
  name: "github-app-auth",
};

Object.assign(process.env, {
  GITHUB_APP_ID: "0",
  GITHUB_APP_CLIENT_ID: "appClientId",
  GITHUB_APP_CLIENT_SECRET: "appClientSecret",
  GITHUB_APP_PRIVATE_KEY: "appPrivateKey",
  KV_REST_API_URL: "https://kvdb.io/1234567890",
  KV_REST_API_TOKEN: "kvdbtoken",
});

describe("auth", () => {
  it("should be able to create a GitHubAppAuthStrategy", () => {
    expect(mk()).toBeDefined();
  });

  it("should be able to call strategy.authenticate", async () => {
    const strategy = mk();
    const result = await strategy.authenticate(
      makeRequest(),
      makeSessionStorage({ [sessionKey]: { login: "login" } }),
      options,
    );
    expect(result).toMatchSnapshot();
  });

  it("not logged in", async () => {
    const strategy = mk();
    const result = await strategy.authenticate(
      makeRequest("?state=state&code=code"),
      makeSessionStorage({
        [sessionKey]: undefined,
        [sessionStateKey]: "state",
      }),
      options,
    );
    expect(result).toMatchSnapshot();
  });

  it("non matching state", async () => {
    expect.assertions(1);
    const strategy = mk();
    const prom = strategy.authenticate(
      makeRequest("?state=state&code=code"),
      makeSessionStorage({
        [sessionKey]: undefined,
        [sessionStateKey]: "state2",
      }),
      options,
    );
    (await expectFailure(prom)).toMatchObject({
      message: "State doesn't match.",
    });
  });
});

class DummySession implements Session {
  id = "0";

  constructor(public data: Record<string, any>) {
    this.data = data;
  }

  get(key: string) {
    return this.data[key];
  }

  unset(key: string) {
    delete this.data[key];
  }

  set(name: string, value: any) {
    this.data[name] = value;
  }

  has(name: string) {
    return name in this.data;
  }

  flash(name: string, value: any) {
    this.data[name] = value;
  }
}

const makeRequest = (extra?: string): Request =>
  ({
    url: "http://localhost:3000/callback" + (extra ?? ""),
    headers: new Headers(),
  }) satisfies Pick<Request, "url" | "headers"> as unknown as Request;
const makeSessionStorage = (bucket: Record<string, any>) =>
  ({
    async getSession(_cookieHeader, _options) {
      return new DummySession(bucket);
    },
  }) satisfies Pick<
    SessionStorage<{}>,
    "getSession"
  > as unknown as SessionStorage<{}>;

async function expectFailure(
  prom: Promise<unknown>,
): Promise<jest.JestMatchers<unknown>> {
  try {
    await prom;
  } catch (e) {
    return expect(await getBody(e));
  }
  throw new Error("expected failure");
}

async function getBody(e: unknown): Promise<unknown> {
  if (!(e instanceof Response)) {
    throw new Error("not a response: " + JSON.stringify(e));
  }
  return await e.json();
}

async function request(url: string) {
  if (url.includes("oauth")) {
    return {
      status: 200,
      headers: {
        date: "Mon, 26 Jul 2021 15:49:05 GMT",
      },
      data: {
        access_token: "fake-token",
        refresh_token: "fake-refresh-token",
        scope: "api",
        expires_in: 3600,
        refresh_token_expires_in: 3600,
      },
    };
  } else if (url.includes("user")) {
    return {
      status: 200,
      data: {
        id: 690,
        login: "Mause",
        name: "Elli",
      },
    };
  }
  throw new Error("unknown request: " + JSON.stringify({ url }));
}

function merge() {}

function parse() {}

let defaults = {
  baseUrl: "https://api.github.com",
};
request.endpoint = {
  DEFAULTS: defaults,
  merge,
  parse,
};

const mk = () => {
  return new GitHubAppAuthStrategy(
    {
      clientID: "clientId",
      clientSecret: "clientSecret",
      callbackURL: "http://localhost:3000/callback",
      scope: "scope",
    },
    async (params) => {
      return _.omit(params, ["request", "extraParams"]);
    },
    request as unknown as RequestInterface,
  );
};
