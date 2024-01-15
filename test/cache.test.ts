import getCache from "~/services/cache";
import dotenv from "dotenv";

dotenv.config();

describe.skip("cache", () => {
  it("should return a cache object", () => {
    const cache = getCache()!;
    expect(cache).toBeDefined();
    expect(cache.get).toBeDefined();
    expect(cache.set).toBeDefined();
  });
  it("should store and retrieve a value", async () => {
    const cache = getCache()!;
    await cache.set("test", "value");
    expect(await cache.get("test")).toBe("value");
  }, 50000);
});
