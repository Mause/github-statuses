// app/routes/auth/github/callback.tsx
import type { LoaderArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";
import { getRedirect, redirectCookie } from "~/octokit.server";

export async function loader({ request }: LoaderArgs) {
  await authenticator().authenticate("github", request, {
    failureRedirect: "/login",
  });
  const target = await getRedirect(request);

  throw redirect(target, {
    headers: { "Set-Cookie": await redirectCookie.serialize(undefined) },
  });
}
