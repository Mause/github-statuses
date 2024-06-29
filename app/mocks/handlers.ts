import { http, HttpResponse, graphql } from "msw";
import type {
  GetIssuesAndPullRequestsQuery,
  GetIssuesAndPullRequestsQueryVariables,
} from "~/components/graphql/graphql";

export const handlers = [
  graphql.query<
    Required<GetIssuesAndPullRequestsQuery>,
    GetIssuesAndPullRequestsQueryVariables
  >("GetUserPullRequests", ({ query, variables }) => {
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
        search: {},
        engine: null,
        java: null,
        nodejs: null,
        rust: null,
      },
    });
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
