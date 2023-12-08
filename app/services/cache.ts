import deasync from "deasync";
import { kv } from "@vercel/kv";

interface SetCommandOptions {}

const syncGet = deasync<string, string>(kv.get.bind(kv));
const syncSet = deasync<string, string, SetCommandOptions | undefined, void>(
  kv.set.bind(kv),
);

const redisCache = {
  get(key: string): string {
    return syncGet(key);
  },
  set(key: string, value: string) {
    syncSet(key, value, undefined);
  },
};

export default redisCache;
