import { Octokit } from "@octokit/rest";
import { request } from "./auth.test";
import { vi } from "vitest";

it("request", async () => {
  const resp = await request("https://api.github.com/user");
  expect(resp).toMatchSnapshot();
});
it("request with octokit", async () => {
  globalThis.fetch = vi.fn().mockImplementation(async (url) => {
    const res = await request(url);

    return {
      ...res,
      headers: new Headers(res.headers),
      text: function () {
        return JSON.stringify(this.data);
      },
    };
  });
  const octokit = new Octokit();
  const resp = await octokit.request("https://api.github.com/user");
  delete resp.headers.date;
  expect(resp).toMatchSnapshot();
});
