// app/routes/auth/github/callback.tsx
import { redirect } from "@remix-run/node";
import { json, type LoaderFunction } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { getRedirect, redirectCookie } from "~/octokit.server";

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

  await authenticator().authenticate("github", request, {
    failureRedirect: "/login",
  });
  const target = await getRedirect(request);

  throw redirect(target, {
    headers: { "Set-Cookie": await redirectCookie.serialize(undefined) },
  });
};
