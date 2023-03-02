import { Button } from "@primer/react";
import { Form } from "@remix-run/react";
import { Wrapper } from "~/components";

// app/routes/login.tsx
export default function Login() {
  return (
    <Wrapper>
      {<></>}
      <Form action="/auth/github" method="post">
        <Button type="submit">Login with GitHub</Button>
      </Form>
    </Wrapper>
  );
}
