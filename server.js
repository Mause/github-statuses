import { createRequestHandler } from "@remix-run/vercel";
import * as build from "@remix-run/dev/server-build";
import { Response } from "@remix-run/node";

const TIMEOUT = 7000;

const handle = createRequestHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext() {
    console.log("loading context");
    return {};
  },
});
export default async function (req, res) {
  let timeoutId;
  await Promise.race([
    await handle(req, res),
    new Promise(
      (resolve) => (timeoutId = setTimeout(resolve(new Response(502)), TIMEOUT))
    ),
  ]);
  clearTimeout(timeoutId);
}
