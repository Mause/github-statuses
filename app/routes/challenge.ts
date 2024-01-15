import type { LoaderFunction } from "@remix-run/node";

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url);

  console.log(url.searchParams);

  const challenge = url.searchParams.get("hub.challenge");

  console.log({ challenge });

  return new Response(challenge, { status: 200 });
};
