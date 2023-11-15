import type { ActionFunction} from "@remix-run/node";
import { json , createCookie } from "@remix-run/node";

export const colorModeCookie = createCookie("colorMode");

export const action: ActionFunction = async ({ request }) => {
  const colorMode = (await request.formData()).get("colorMode");

  const setCookie = await colorModeCookie.serialize(colorMode);

  return json(
    { colorMode },
    {
      headers: {
        "Set-Cookie": setCookie,
      },
    },
  );
};
