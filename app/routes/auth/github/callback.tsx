// app/routes/auth/github/callback.tsx
import type { LoaderFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { getRedirect, redirectCookie } from "~/octokit.server";

export const loader: LoaderFunction = async ({ request }) => {
  await authenticator().authenticate("github", request, {
    failureRedirect: "/login",
  });
  const target = await getRedirect(request);

  throw redirect(target, {
    headers: { "Set-Cookie": await redirectCookie.serialize(undefined) },
  });
};
