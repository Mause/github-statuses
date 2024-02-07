import type { LoaderFunction} from "@remix-run/node";
import { defer } from "@remix-run/node";
import { Await, useLoaderData } from "@remix-run/react";
import { Suspense } from "react";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const loader: LoaderFunction = () => {
  return defer({
    immediate: "this data is available immediately",
    deferred: sleep(3000).then(() => "this data is available after 3 seconds"),
  });
};

export function Deferred() {
  const { immediate, deferred } = useLoaderData<typeof loader>();

  return (
    <div>
      <p>Immediate: {immediate}</p>
      <p>
        Deferred:
        <Suspense fallback="...">
          <Await resolve={deferred}>{(data) => data}</Await>
        </Suspense>
      </p>
    </div>
  );
}
