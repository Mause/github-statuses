import { kv } from "@vercel/kv";
import type { StrategyOptions } from "@octokit/auth-app";
import _ from "lodash";

type Cache = StrategyOptions["cache"];

function getCache(): Cache {
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
