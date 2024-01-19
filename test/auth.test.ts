import type { Session, SessionStorage } from "@remix-run/node";
import { GitHubAppAuthStrategy } from "~/services/github-app-auth.server";
import type { RequestInterface } from "@octokit/types";
import type { AuthenticateOptions } from "remix-auth";
import _ from "lodash";
import { DummySession } from "./dummySession";

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
    await expectFailure(prom).toMatchObject({
      message: "State doesn't match.",
    });
  });
  it("missing code", async () => {
    expect.assertions(1);
    const strategy = mk();
    const prom = strategy.authenticate(
      makeRequest("?state=state"),
      makeSessionStorage({
        [sessionKey]: undefined,
        [sessionStateKey]: "state",
      }),
      options,
    );
    await expectFailure(prom).toMatchObject({
      message: "Missing code.",
    });
  });
  it("missing state on session", async () => {
    expect.assertions(1);
    const strategy = mk();
    const prom = strategy.authenticate(
      makeRequest("?state=state&code=code"),
      makeSessionStorage({
        [sessionKey]: undefined,
      }),
      options,
    );
    await expectFailure(prom).toMatchObject({
      message: "Missing state on session.",
    });
  });
  it("make login request", async () => {
    expect.assertions(5);
    const strategy = mk();

    try {
      await strategy.authenticate(
        makeNonCallback(),
        makeSessionStorage({}),
        options,
      );
    } catch (e) {
      expect(isResponse(e)).toBeTruthy();
      if (isResponse(e)) {
        let location = new URL(e.headers.get("location")!);
        expect(location.host).toEqual("github.com");
        let sp = location.searchParams;
        expect(sp.has("state")).toBeTruthy();
        sp.delete("state");
        expect(Array.from(sp.entries())).toMatchSnapshot();
        expect(location).toMatchSnapshot();
      }
    }
  });
});

const makeNonCallback = (): Request =>
  ({
    url: "http://localhost/login",
    headers: new Headers(),
  }) as unknown as Request;

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
    async commitSession(session: Session, options): Promise<string> {
      return "serialized cookie session";
    },
  }) satisfies Pick<
    SessionStorage<{}>,
    "getSession" | "commitSession"
  > as unknown as SessionStorage<{}>;

function expectFailure(
  prom: Promise<unknown>,
): jest.AndNot<jest.Matchers<Promise<void>, Promise<unknown>>> {
  return expect(
    (async () => {
      try {
        await prom;
      } catch (e) {
        return getBody(e);
      }
      throw new Error("expected failure");
    })(),
  ).resolves;
}

function isResponse(e: unknown): e is Response {
  return e instanceof Response;
}

async function getBody(e: unknown): Promise<unknown> {
  if (!isResponse(e)) {
    throw new Error("not a response: " + JSON.stringify(e));
  }
  return await e.json();
}
const now = new Date().toUTCString();

export async function request(url: string) {
  console.warn({ url });
  if (url.includes("oauth")) {
    return {
      url,
      status: 200,
      headers: {
        date: now,
      },
      data: {
        access_token: "fake-token",
        refresh_token: "fake-refresh-token",
        scope: "api",
        expires_in: 3600,
        refresh_token_expires_in: 3600,
      },
      text: function () {
        return JSON.stringify(this.data);
      },
    };
  } else if (url.includes("user")) {
    return {
      url,
      status: 200,
      headers: {
        date: now,
      },
      data: {
        id: 690,
        login: "Mause",
        name: "Elli",
      },
    };
  }
  const msg = "unknown request: " + JSON.stringify({ url });
  console.warn(msg);
  throw new Error(msg);
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
