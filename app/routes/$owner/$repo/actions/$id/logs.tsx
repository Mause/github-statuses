import type { DataFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getOctokit } from "~/octokit.server";
import { getLogs } from "./archive.server";
import { Details, ToggleSwitch, FormControl, useDetails } from "@primer/react";
import { extname } from "path";
import { PreStyle } from "~/components/Markdown";
import styled from "styled-components";
import { useEffect, useState } from "react";

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

/**
 * See https://learn.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands?view=azure-devops&tabs=bash
 *
 * I guess GitHub Actions translates to the Azure syntax under the hood
 */
export function constructLine(original: string) {
  if (!(original.startsWith("##[") || original.startsWith("##vso["))) {
    return original;
  }
  const { isVSO, directive, line } = matchDirective(original);

  switch (directive) {
    case "error":
      return <span style={{ color: paleRed }}>{line}</span>;
    case "warning":
    case "debug":
    case "section":
    case "group":
    case "endgroup":
      return line;
  }

  return JSON.stringify({ isVSO, directive, line, original });
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
  const res = line.match(/##(vso)?\[([^\[]*)\](.*)/);
  return {
    isVSO: !!res![1],
    directive: res![2],
    line: res![3],
    original: line,
  };
}

function extractErrors(data: string[]) {
  return data.filter(
    (line) =>
      line.toLocaleLowerCase().includes("error") &&
      line !== "Evaluating continue on error",
  );
}

function extractName(name: string): string {
  name = name.substring(0, name.length - extname(name).length);

  return name.split("_")[1];
}

export default function Logs() {
  const { logs } = useLoaderData<typeof loader>();
  const [onlyErrors, setOnlyErrors] = useState(true);
  const [extracted, setExtracted] = useState<[string, string[]][]>([]);

  useEffect(() => {
    setExtracted(
      logs.map(([name, data]) => {
        let lines = data
          .split("\n")
          .map((line) => line.substring(TIMESTAMP_LENGTH + 1));

        if (onlyErrors) {
          lines = extractErrors(lines);
        }

        return [extractName(name), lines] as [string, string[]];
      }),
    );
  }, [logs, onlyErrors]);

  return (
    <>
      <FormControl>
        <FormControl.Label>Only show errors</FormControl.Label>
        <ToggleSwitch defaultChecked={onlyErrors} onChange={setOnlyErrors} />
      </FormControl>
      <ul>
        {extracted
          .filter(([, data]) => data.length)
          .map(([name, data]) => (
            <li key={name}>
              <Log name={name} data={data} />
            </li>
          ))}
      </ul>
    </>
  );
}
