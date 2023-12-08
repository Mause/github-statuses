import type { Session, SessionStorage } from "@remix-run/node";
import { GitHubAppAuthStrategy } from "~/services/github-app-auth.server";

const sessionKey = "oauth2:session";
const sessionStateKey = "oauth2:state";
const options = {
  sessionKey,
  sessionStateKey,
  sessionErrorKey: "",
  sessionStrategyKey: "",
  name: "",
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

const mk = () => {
  return new GitHubAppAuthStrategy(
    {
      clientID: "clientId",
      clientSecret: "clientSecret",
      callbackURL: "http://localhost:3000/callback",
      scope: "scope",
    },
    async (_params) => {
      return {};
    },
  );
};
