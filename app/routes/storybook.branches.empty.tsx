import { Dashboard } from "~/routes/$owner/$repo/branches";

export default function DashboardEmptyStory() {
  return (
    <Dashboard
      refs={[]}
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
