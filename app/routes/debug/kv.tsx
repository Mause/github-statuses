import { getKv } from "~/services/cache";
import { splatObject } from "~/components/ErrorBoundary";
import { timeout } from ".";
import type { VercelKV } from "@vercel/kv";

async function getKeys(kv: VercelKV) {
  const keys = [];
  for await (const key of kv.scanIterator({ match: "*" })) {
    keys.push(key);
  }
  return keys;
}

async function pingKv() {
  try {
    const kv = getKv();

    return {
      dbsize: await timeout(kv.dbsize()),
      keys: await timeout(getKeys(kv)),
    };
  } catch (e) {
    return splatObject(e);
  }
}

export const loader = async () => {
  return {
    kv: await timeout(pingKv()),
  };
};
