import { getQueryName , isGraphQLError } from "~/octokit.server";
import { GraphqlResponseError } from "@octokit/graphql";

describe("getQueryName", () => {
  it("should return the correct query name", () => {
    expect(getQueryName("query searchRepositories {}")).toBe(
      "searchRepositories",
    );
    expect(getQueryName("query searchRepositories(name: String!) {}")).toBe(
      "searchRepositories",
    );
  });
  it("isGraphQLError", () => {
    expect(isGraphQLError({})).toBeFalsy();
    expect(
      isGraphQLError(
        new GraphqlResponseError(
          {
            method: "GET",
            url: "https://api.github.com/graphql",
          },
          {},
          {
            data: {},
            errors: [
              {
                type: "NOT_FOUND",
                path: ["searchRepositories"],
                locations: [{ line: 1, column: 1 }],
                message:
                  "Could not resolve to a User with the login of 'not-a-real-user'.",
                extensions: {},
              },
            ],
          },
        ),
      ),
    ).toBe(true);
  });
});
