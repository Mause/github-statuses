import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";

export async function loader() {
  await new Promise((resolve) => setTimeout(resolve, 15000));

  return "hello";
}

export default function Index() {
  return useLoaderDataReloading<typeof loader>();
}
