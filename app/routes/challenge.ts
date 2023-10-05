import type { LoaderFunction} from "@remix-run/node";
import { Response } from "@remix-run/node";

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url);

  console.log(url.searchParams);

  return new Response(url.searchParams.get("hub.challenge"), { status: 200 });
};
