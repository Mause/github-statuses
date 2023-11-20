import type { DataFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getOctokit } from "~/octokit.server";
import { getLogs } from "./archive.server";
import { Details, useDetails } from "@primer/react";
import { extname } from "path";
import { PreStyle } from "~/components/Markdown";
import styled from "styled-components";

const TIMESTAMP_LENGTH = "2023-11-19T15:41:59.0131964Z".length;

export const loader = async ({ request, params }: DataFunctionArgs) => {
  const octokit = await getOctokit(request);

  const { owner, repo, id } = params;

  const attempt = await octokit.actions.getWorkflowRun({
    owner: owner!,
    repo: repo!,
    run_id: Number(id!),
  });

  const datum = attempt.data;

  const req = await octokit.request(datum.logs_url, {
    mediaType: {
      format: "raw",
    },
  });

  return { logs: getLogs(req.data as ArrayBuffer) };
};

const Summary = styled.summary<{ open: boolean }>`
  display: list-item;
  counter-increment: list-item 0;
  list-style-type: ${(props) =>
    props.open ? "disclosure-open" : "disclosure-closed"} !important;
  list-style-position: inside !important;
`;

const paleRed = "#ff5353";

function constructLine(original: string) {
  if (!original.startsWith("##[")) {
    return original;
  }
  const { directive, line } = matchDirective(original);

  switch (directive) {
    case "error":
      return <span style={{ color: paleRed }}>{line}</span>;
  }

  return JSON.stringify({ directive, line, original });
}

function Log({ name, data }: { name: string; data: string[] }) {
  const { open, getDetailsProps } = useDetails({});

  return (
    <Details {...getDetailsProps()}>
      <Summary open={open ?? false}>{name}</Summary>
      <PreStyle>
        <pre>
          <code>
            {data.map((line, i) => (
              <span key={i}>
                {constructLine(line)}
                <br />
              </span>
            ))}
          </code>
        </pre>
      </PreStyle>
    </Details>
  );
}

function matchDirective(line: string) {
  const res = line.match(/##\[([^\[]*)\](.*)/);
  return { directive: res![1], line: res![2], original: line };
}

function extractErrors(data: string) {
  return data
    .split("\n")
    .filter((line) => line.toLocaleLowerCase().includes("error"))
    .map((line) => line.substring(TIMESTAMP_LENGTH + 1))
    .filter((line) => line !== "Evaluating continue on error");
}

function extractName(name: string): string {
  name = name.substring(0, name.length - extname(name).length);

  let [, reName] = name.split("_");

  return reName;
}

export default function Logs() {
  const { logs } = useLoaderData<typeof loader>();

  const extracted = logs.map(
    ([name, data]) =>
      [extractName(name), extractErrors(data)] as [string, string[]],
  );

  return (
    <ul>
      {extracted
        .filter(([, data]) => data.length)
        .map(([name, data]) => (
          <li key={name}>
            <Log name={name} data={data} />
          </li>
        ))}
    </ul>
  );
}
