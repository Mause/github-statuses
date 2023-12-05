import type { DataFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getLogsForUrl, Job } from "~/services/archive.server";
import {
  getInstallationOctokit,
  getCachedInstallationId,
} from "~/services/installation";
import { GearIcon } from "@primer/octicons-react";
import {
  Flash,
  IconButton,
  Details,
  ToggleSwitch,
  FormControl,
  useDetails,
} from "@primer/react";
import { PreStyle } from "~/components/Markdown";
import styled from "styled-components";
import { useEffect, useState } from "react";
import _ from "lodash";

const TIMESTAMP_LENGTH = "2023-11-19T15:41:59.0131964Z".length;
interface SingleStep {
  name: string;
  index: number;
  lines: string[];
}
interface SingleJob {
  name: string;
  steps: SingleStep[];
}
type AllSteps = SingleJob[];

export const loader = async ({ request, params }: DataFunctionArgs) => {
  const octokit = await getInstallationOctokit(request);

  const { owner, repo, id } = params;

  const attempt = await octokit.actions.getWorkflowRun({
    owner: owner!,
    repo: repo!,
    run_id: Number(id!),
  });

  let logs: Job;
  try {
    logs = await getLogsForUrl(octokit, attempt.data.logs_url);
  } catch (e) {
    const installationId = await getCachedInstallationId();

    const url = `https://github.com/apps/action-statuses/installations/${installationId}`;

    return {
      message: "Logs not found. This installation probably doesn't have access",
      url,
    };
  }

  return { logs };
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

function Job({ name, steps }: { name: string; steps: SingleStep[] }) {
  const { open, getDetailsProps } = useDetails({});
  return (
    <Details {...getDetailsProps()}>
      <Summary open={open ?? false}>{name}</Summary>
      <ol>
        {steps
          .filter(({ lines }) => lines.length)
          .map(({ name, lines, index }) => (
            <li key={name} value={index}>
              <Step name={name} lines={lines} />
            </li>
          ))}
      </ol>
    </Details>
  );
}

function Step({ name, lines }: { name: string; lines: string[] }) {
  const { open, getDetailsProps } = useDetails({});

  return (
    <Details {...getDetailsProps()}>
      <Summary open={open ?? false}>{name}</Summary>
      <PreStyle>
        <pre>
          <code>
            {lines.map((line, i) => (
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

export default function Logs() {
  const data = useLoaderData<typeof loader>();
  const [onlyErrors, setOnlyErrors] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [extracted, setExtracted] = useState<AllSteps>([]);
  const logs = "logs" in data ? data.logs : {};

  useEffect(() => {
    setExtracted(
      _.map(logs, (data, name) => ({
        name,
        steps: data.map((step) => {
          let lines = step.contents;

          if (!showTimestamps) {
            lines = lines.map((line) => line.substring(TIMESTAMP_LENGTH + 1));
          }

          // TODO: move this filtering to the backend
          if (onlyErrors) {
            lines = extractErrors(lines);
          }

          return { name: step.name, lines, index: step.index };
        }),
      })),
    );
  }, [logs, onlyErrors, showTimestamps]);

  return (
    <>
      {"message" in data ? (
        <Flash variant="danger">
          {data.message}
          <br />
          <IconButton
            icon={GearIcon}
            as="a"
            href={data.url}
            aria-label="installation settings"
          />
          Fix this in your installation setting
        </Flash>
      ) : undefined}
      <FormControl>
        <FormControl.Label>Only show errors</FormControl.Label>
        <ToggleSwitch defaultChecked={onlyErrors} onChange={setOnlyErrors} />
      </FormControl>
      <FormControl>
        <FormControl.Label>Show timestamps</FormControl.Label>
        <ToggleSwitch
          defaultChecked={showTimestamps}
          onChange={setShowTimestamps}
        />
      </FormControl>
      <ul>
        {extracted
          .filter(({ steps }) => steps.length)
          .map(({ name, steps }) => (
            <li key={name}>
              <Job name={name} steps={steps} />
            </li>
          ))}
      </ul>
    </>
  );
}
