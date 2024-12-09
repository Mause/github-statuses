import { createClient } from "@vercel/kv";
import type { StrategyOptions } from "@octokit/auth-app";
import _ from "lodash";
import dotenv from "dotenv";

dotenv.config();

export function throwError(msg: string): never {
  throw new Error(msg);
}

type XCache = StrategyOptions["cache"] & {
  stat(): Promise<{ dbsize: number; keys: string[] }>;
};

const ONE_HOUR_IN_SECONDS = 60 * 60;

function _getCache(): XCache {
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
    async stat() {
      const keys = [];
      for await (const key of kv.scanIterator({ match: "*" })) {
        keys.push(key);
      }

      return { dbsize: await kv.dbsize(), keys };
    },
  };
}

export const getCache = _.memoize(_getCache);
