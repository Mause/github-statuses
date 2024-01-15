import { Button } from "@primer/react";
import { type DataFunctionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { Wrapper } from "~/components";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import { authenticator } from "~/services/auth.server";

export const loader = async ({ request }: DataFunctionArgs) =>
  await authenticator().isAuthenticated(request, {
    successRedirect: "/",
  });

export default function Login() {
  useLoaderDataReloading<typeof loader>();
  return (
    <Wrapper>
      <></>
      <Form action="/auth/github" method="post">
        <Button type="submit">Login with GitHub</Button>
      </Form>
    </Wrapper>
  );
}
