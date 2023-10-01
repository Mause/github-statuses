// app/routes/auth/github/callback.tsx
import type { LoaderFunction } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { getRedirect } from "~/octokit.server";

export const loader: LoaderFunction = async ({ request }) => {
  return authenticator().authenticate("github", request, {
    successRedirect: await getRedirect(request),
    failureRedirect: "/login",
  });
}
