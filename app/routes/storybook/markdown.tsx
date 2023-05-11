import type { DataFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Markdown, dedentBlock } from "~/components";
import { useLoaderDataReloading } from "~/components/useRevalidateOnFocus";
import { tryGetOctokit } from "~/octokit.server";

export async function loader({ request }: DataFunctionArgs) {
  const octokit = await tryGetOctokit(request);
  const res = await octokit.markdown.render({
    text: source,
  });
  return json({
    rendered: res.data,
  });
}

const source = dedentBlock`
        \`\`\`python
        def hello():
            print('yo')
            x + y
        \`\`\`
        `;

export default function Test() {
  const { rendered } = useLoaderDataReloading<typeof loader>();

  return <Markdown rendered={rendered} />;
}
