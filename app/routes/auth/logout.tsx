import type { LoaderFunction } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export const loader: LoaderFunction = async ({ request }) =>
  await (
    await authenticator()
  ).logout(request, {
    redirectTo: "/login",
  });
