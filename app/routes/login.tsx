import { Button } from "@primer/react";
import type { DataFunctionArgs} from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Wrapper } from "~/components";
import { getUserNoRedirect } from "~/octokit.server";

export const loader = async ({ request }: DataFunctionArgs) =>
  json({ user: await getUserNoRedirect(request) });

export default function Login() {
  const { user } = useLoaderData<typeof loader>();
  return (
    <Wrapper>
      {<></>}
      <>
        {user ? (
          <div>{user.login} logged in</div>
        ) : (
          <Form action="/auth/github" method="post">
            <Button type="submit">Login with GitHub</Button>
          </Form>
        )}
      </>
    </Wrapper>
  );
}
