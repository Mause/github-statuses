import { defer } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader() {
  await new Promise((resolve) => setTimeout(resolve, 15000));

  return "hello";
}

export default function Index() {
  return useLoaderData<typeof loader>();
}
