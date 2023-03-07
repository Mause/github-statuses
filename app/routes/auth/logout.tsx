import { Button } from "@primer/react";
import type { ActionArgs } from "@remix-run/node";
import { Form } from "@remix-run/react";
import { Wrapper } from "~/components";
import { authenticator } from "~/services/auth.server";

export const action = async ({ request }: ActionArgs) =>
  authenticator().logout(request, {
    redirectTo: "/login",
  });

export default function Logout() {
  return (
    <Wrapper>
      {<></>}
      <Form method="post">
        <Button type="submit">Logout with GitHub</Button>
      </Form>
    </Wrapper>
  );
}
