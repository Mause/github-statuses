// app/routes/auth/github/callback.tsx
import type { LoaderFunction } from "@remix-run/node";
import { REDIRECT_URL } from "~/components/queryParams";
import { authenticator } from "~/services/auth.server";

export const loader: LoaderFunction = async ({ request }) => {
  const successRedirect =
    new URL(request.url).searchParams.get(REDIRECT_URL) ?? "/";

  return authenticator().authenticate("github", request, {
    successRedirect,
    failureRedirect: "/login",
  });
};
