import { Dashboard } from "~/routes/$owner/$repo/branches";

export default function DashboardStory() {
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
      refs={refs}
      repo={{
        owner: { login: "Mause" },
        name: "duckdb",
        defaultBranchRef: {
          name: "main",
        },
      }}
    />
  );
}
