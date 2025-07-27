import { getKv } from "~/services/cache";
import { splatObject } from "~/components/ErrorBoundary";
import { timeout } from "~/services";

export const loader = async () => {
  try {
    const kv = getKv();
    return {
      dbsize: await timeout(kv.dbsize(), "dbsize"),
    };
  } catch (e) {
    return splatObject(e);
  }
};
