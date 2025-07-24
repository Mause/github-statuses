import getCache from "~/services/cache";
import { splatObject } from "~/components/ErrorBoundary";
import { timeout } from ".";

async function pingKv() {
  try {
    return await getCache().stat();
  } catch (e) {
    return splatObject(e);
  }
}

export const loader = async () => {
  return {
    kv: await timeout(pingKv()),
  };
};
