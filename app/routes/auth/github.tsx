// app/routes/auth/github.tsx
import type { ActionFunction} from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { authenticator } from "~/services/auth.server";

export async function loader() {
  return redirect("/login");
}

export const action: ActionFunction = async ({ request }) => {
  return authenticator().authenticate("github", request);
};
