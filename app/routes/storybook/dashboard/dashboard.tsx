import { Dashboard } from "~/routes/$owner/$repo/dashboard";

export default function DashboardStory() {
  const pulls = [
    {
      number: 1,
      title: "Add a README description",
      resourcePath: "/Mause/duckdb/pull/1",
      permalink: "https://github.com/Mause/duckdb/pull/1",
      branchName: "readme",
    },
    {
      number: 2,
      title: "Add a license",
      resourcePath: "/Mause/duckdb/pull/2",
      permalink: "https://github.com/Mause/duckdb/pull/2",
      branchName: "add-license-1",
      mirrored: "https://github.com/duckdb/duckdb/pull/2",
    },
  ];
  const refs = [
    {
      name: "c-api-functions",
      associatedPullRequests: {
        totalCount: 0,
      },
    },
  ];

  return (
    <Dashboard
      pulls={pulls}
      refs={refs}
      repo={{
        owner: { login: "Mause" },
        name: "duckdb",
        parent: {
          name: "duckdb",
          nameWithOwner: "Mause/duckdb",
          owner: { login: "duckdb" },
        },
      }}
    />
  );
}
