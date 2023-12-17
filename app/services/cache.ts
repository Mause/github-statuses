import { createClient } from "@vercel/kv";
import type { StrategyOptions } from "@octokit/auth-app";
import _ from "lodash";
import dotenv from "dotenv";

dotenv.config();

type Cache = StrategyOptions["cache"];

function throwError(msg: string): never {
  throw new Error(msg);
}

function getCache(): Cache {
  const { env } = process;
  const kv = createClient({
    url:
      env.UPSTASH_REDIS_REST_URL ??
      throwError("Missing env var: UPSTASH_REDIS_REST_URL"),
    token:
      env.UPSTASH_REDIS_REST_TOKEN ??
      throwError("Missing env var: UPSTASH_REDIS_REST_TOKEN"),
  });
  return {
    // @ts-expect-error
    async get(key: string): Promise<string | undefined> {
      return (await kv.get<string>(key)) ?? undefined;
    },
    async set(key: string, value: string) {
      await kv.set(key, value);
    },
  };
}

export default _.memoize(getCache);
