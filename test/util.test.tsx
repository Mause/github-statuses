import { getQueryName } from "~/octokit.server";

describe("getQueryName", () => {
  it("should return the correct query name", () => {
    expect(getQueryName("query searchRepositories {}")).toBe(
      "searchRepositories",
    );
    expect(getQueryName("query searchRepositories(name: String!) {}")).toBe(
      "searchRepositories",
    );
  });
});
