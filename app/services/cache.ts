import deasync from "deasync";
import { kv } from "@vercel/kv";
import type { StrategyOptions } from "@octokit/auth-app";
import type { SetCommandOptions } from "@upstash/redis";
import _ from "lodash";

type Cache = StrategyOptions["cache"];

function getCache(): Cache {
  const syncGet = deasync<string, string>(kv.get.bind(kv));
  const syncSet = deasync<string, string, SetCommandOptions | undefined, void>(
    kv.set.bind(kv),
  );

  return {
    get(key: string): string {
      return syncGet(key);
    },
    set(key: string, value: string) {
      syncSet(key, value, undefined);
    },
  };
}

export default _.memoize(getCache);
