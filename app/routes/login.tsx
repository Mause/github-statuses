import { Button } from "@primer/react";
import type { DataFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Wrapper } from "~/components";
import { authenticator } from "~/services/auth.server";

export const loader = async ({ request }: DataFunctionArgs) =>
  await authenticator().isAuthenticated(request, {
    successRedirect: "/",
  });

export default function Login() {
  useLoaderData<typeof loader>();
  return (
    <Wrapper>
      <></>
      <Form action="/auth/github" method="post">
        <Button type="submit">Login with GitHub</Button>
      </Form>
    </Wrapper>
  );
}
