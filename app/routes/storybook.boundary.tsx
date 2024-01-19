import { Button } from "@primer/react";
import { Form } from "@remix-run/react";

export function action() {
  throw new TypeError("Failed to fetch");
}

export default function Boundary() {
  return (
    <div>
      <Form method="POST">
        <Button type="submit">Failed to fetch</Button>
      </Form>
    </div>
  );
}
