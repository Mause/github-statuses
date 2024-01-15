import { Button } from "@primer/react";
import { json, type DataFunctionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { Wrapper } from "~/components";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import { queryParams, REDIRECT_URL } from "~/components/queryParams";
import { authenticator } from "~/services/auth.server";

export const loader = async ({ request }: DataFunctionArgs) => {
  await authenticator().isAuthenticated(request, {
    successRedirect: "/",
  });

  const redirect_to: string = new URL(request.url).searchParams.get(
    REDIRECT_URL,
  )!;
  return json({ [REDIRECT_URL]: redirect_to });
};

export default function Login() {
  const { redirect_url } = useLoaderDataReloading<typeof loader>();
  return (
    <Wrapper>
      <></>
      <Form
        action={queryParams("/auth/github", { [REDIRECT_URL]: redirect_url })}
        method="post"
      >
        <Button type="submit">Login with GitHub</Button>
      </Form>
    </Wrapper>
  );
}
