import type { Config, Handler } from "@netlify/functions";

export const config: Config = {
  path: "/*",
};

const handler: Handler = async (event: Request, context) => {
  const name = new URL(event.url).searchParams.get("name") || "stranger";

  return new Response(
    JSON.stringify({
      message: `Hello, ${name}!`,
      url: event.url,
      headers: Object.fromEntries(event.headers.entries()),
    }),
  );
};
export default handler;
