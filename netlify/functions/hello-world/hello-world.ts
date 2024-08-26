import type { Config, Handler } from "@netlify/functions";

export const config: Config = {
  path: "/*",
};

const handler: Handler = async (event, context) => {
  const { name = "stranger" } = event.queryStringParameters || {};

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: `Hello, ${name}!`,
    }),
  };
};
export default handler;
