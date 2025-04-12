import { Button, Flash } from "@primer/react";
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { Wrapper } from "~/components";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import { authenticator } from "~/services/auth.server";
import { commitSession, getSession } from "~/services/session.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  const data = { error: session.get("error") };

  // this will redirect if we're actually already logged in
  await (
    await authenticator()
  ).isAuthenticated(request, {
    successRedirect: "/",
  });

  return json(data, {
    headers: {
      cookie: await commitSession(session),
    },
  });
};

export default function Login() {
  const { error } = useLoaderDataReloading<typeof loader>();
  return (
    <Wrapper>
      <></>
      <>
        {error ? (
          <Flash data-testid="error" variant="warning">
            {error}
          </Flash>
        ) : undefined}
        <Form action="/auth/github" method="post">
          <Button type="submit">Login with GitHub</Button>
        </Form>
      </>
    </Wrapper>
  );
}
