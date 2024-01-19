import { createUrl } from "~/routes/$owner.$repo.dashboard";

describe("createUrl", () => {
  it("should generate the correct URL with query parameters", () => {
    const source = {
      owner: "sourceOwner",
      repo: "sourceRepo",
      branchName: "sourceBranch",
    };
    const target = {
      owner: "targetOwner",
      repo: "targetRepo",
      branchName: "targetBranch",
    };
    const title = "Test Pull Request";
    const body = "This is a test pull request";

    const expectedUrl =
      "https://github.com/targetOwner/targetRepo/compare/targetBranch...sourceOwner:sourceRepo:sourceBranch?quick_pull=1&title=Test+Pull+Request&body=This+is+a+test+pull+request";

    const url = createUrl({ source, target, title, body });

    expect(url).toBe(expectedUrl);
  });

  it("should generate the correct URL without query parameters", () => {
    const source = {
      owner: "sourceOwner",
      repo: "sourceRepo",
      branchName: "sourceBranch",
    };
    const target = {
      owner: "targetOwner",
      repo: "targetRepo",
      branchName: "targetBranch",
    };
    const title = "";
    const body = "";

    const expectedUrl =
      "https://github.com/targetOwner/targetRepo/compare/targetBranch...sourceOwner:sourceRepo:sourceBranch?quick_pull=1&title=&body=";

    const url = createUrl({ source, target, title, body });

    expect(url).toBe(expectedUrl);
  });
});
