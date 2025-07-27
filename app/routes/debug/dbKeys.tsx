import { getKv } from "~/services/cache";
import { splatObject } from "~/components/ErrorBoundary";
import type { VercelKV } from "@vercel/kv";
import { timeout } from "~/services";

async function getKeys(kv: VercelKV) {
  const keys = [];
  for await (const key of kv.scanIterator({ match: "*" })) {
    keys.push(key);
    if (keys.length >= 10) {
      break;
    }
  }
  return keys;
}

export const loader = async () => {
  try {
    const kv = getKv();
    return {
      keys: await timeout(getKeys(kv), "getKeys"),
    };
  } catch (e) {
    return splatObject(e);
  }
};
