import type { Config, Handler } from "@netlify/functions";
import * as fs from "fs/promises";

export const config: Config = {
  path: "/*",
};

const handler: Handler = async (event: Request, context) => {
  const name = new URL(event.url).searchParams.get("name") || "stranger";

  let files = null;
  try {
    files = await fs.readdir(".");
  } catch (error) {
    console.error(error);
  }

  return new Response(
    JSON.stringify({
      message: `Hello, ${name}!`,
      url: event.url,
      headers: Object.fromEntries(event.headers.entries()),
      files,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
};
export default handler;
