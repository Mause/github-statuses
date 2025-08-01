import { createClient } from "@vercel/kv";
import type { StrategyOptions } from "@octokit/auth-app";
import _ from "lodash";
import dotenv from "dotenv";

dotenv.config();
type RedisConfigNodejs = Parameters<typeof createClient>[0];

export function throwError(msg: string): never {
  throw new Error(msg);
}

type XCache = StrategyOptions["cache"];

const ONE_HOUR_IN_SECONDS = 60 * 60;

function getCache(): XCache {
  const kv = getKv();
  return {
    async get(key: string): Promise<string> {
      console.log(`retrieving from cache: ${key}`);
      return (await kv.get<string>(key))!;
    },
    async set(key: string, value: string) {
      console.log(`setting cache: ${key}`);
      await kv.set(key, value, {
        ex: ONE_HOUR_IN_SECONDS,
      });
    },
  };
}

export function getConfig(): RedisConfigNodejs {
  const { env } = process;
  return {
    url:
      env.UPSTASH_REDIS_REST_URL ??
      throwError("Missing env var: UPSTASH_REDIS_REST_URL"),
    token:
      env.UPSTASH_REDIS_REST_TOKEN ??
      throwError("Missing env var: UPSTASH_REDIS_REST_TOKEN"),
    latencyLogging: true,
    enableAutoPipelining: false,
  };
}

export function getKv() {
  return createClient(getConfig());
}

export default _.memoize(getCache);
