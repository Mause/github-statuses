// app/routes/auth/github/callback.tsx
import type { LoaderArgs } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { getRedirect } from "~/octokit.server";

export async function loader({ request }: LoaderArgs) {
  return authenticator().authenticate("github", request, {
    successRedirect: getRedirect(request),
    failureRedirect: "/login",
  });
}
