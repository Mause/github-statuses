import { Dashboard } from "~/routes/$owner/$repo/dashboard";

export default function DashboardEmptyStory() {
  return (
    <Dashboard
      pulls={[]}
      refs={[]}
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