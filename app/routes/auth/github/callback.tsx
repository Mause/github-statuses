// app/routes/auth/github/callback.tsx
import { json, type LoaderFunction } from "@remix-run/node";
import { REDIRECT_URL } from "~/components/queryParams";
import { authenticator } from "~/services/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  const searchParams = new URL(request.url).searchParams;

  if (searchParams.has("error")) {
    return json(
      {
        error: searchParams.get("error"),
        error_description: searchParams.get("error_description"),
        error_uri: searchParams.get("error_uri"),
      },
      {
        status: 500,
      },
    );
  }

  const successRedirect = searchParams.get(REDIRECT_URL) ?? "/";

  return authenticator().authenticate("github", request, {
    successRedirect,
    failureRedirect: "/login",
  });
};
