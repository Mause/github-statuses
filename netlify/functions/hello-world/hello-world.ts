import type { Config, Handler } from "@netlify/functions";

export const config: Config = {
  path: "/*",
};

const handler: Handler = async (event, context) => {
  const { name = "stranger" } = event.queryStringParameters || {};

  return new Response(
    JSON.stringify({
      message: `Hello, ${name}!`,
    }),
  );
};
export default handler;
