import { http, HttpResponse, graphql } from "msw";
import type {
  GetUserPullRequestsQuery,
  GetUserPullRequestsQueryVariables,
} from "~/components/graphql/graphql";

export const handlers = [
  graphql.query<
    Required<GetUserPullRequestsQuery>,
    GetUserPullRequestsQueryVariables
  >("GetUserPullRequests", ({ query, variables }) => {
    console.log({ variables });
    if (variables.owner === "octocat") {
      return HttpResponse.json({
        errors: [
          {
            message: "Not Found",
            locations: [
              {
                line: 1,
                column: 1,
              },
            ],
            path: ["user"],
          },
        ],
        data: {
          __typename: "Query",
          user: null,
        },
      });
    } else {
      throw new Error("No mock defined for this query");
    }
  }),
  // Intercept "GET https://example.com/user" requests...
  http.get("https://example.com/user", () => {
    // ...and respond to them using this JSON response.
    return HttpResponse.json({
      id: "c7b3d8e0-5e0b-4b0f-8b3a-3b9f4b3d3b3d",
      firstName: "John",
      lastName: "Maverick",
    });
  }),
];
