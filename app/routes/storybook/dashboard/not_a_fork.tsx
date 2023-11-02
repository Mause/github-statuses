import { Dashboard } from "~/routes/$owner/$repo/dashboard";

export default function DashboardEmptyStory() {
  return (
    <Dashboard
      pulls={[]}
      refs={[]}
      repo={{
        owner: { login: "Mause" },
        name: "duckdb",
        defaultBranchRef: {
          name: "main",
        },
        parent: undefined,
      }}
    />
  );
}