import type { DataFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { Job as JobShape } from "~/services/archive.server";
import { getLogsForUrl } from "~/services/archive.server";
import ansicolor from "ansicolor";
import {
  getInstallationOctokit,
  getInstallationId,
} from "~/services/installation";
import { GearIcon } from "@primer/octicons-react";
import {
  Flash,
  IconButton,
  Details,
  ToggleSwitch,
  FormControl,
  useDetails,
  Box,
} from "@primer/react";
import { PreStyle } from "~/components/Markdown";
import styled from "styled-components";
import { useEffect, useState } from "react";
import _ from "lodash";
import { getOctokit } from "~/octokit.server";
import { titleCase } from "~/components";

const TIMESTAMP_LENGTH = "2023-11-19T15:41:59.0131964Z".length;
interface Line {
  line: string;
  timestamp: string;
}
interface SingleStep {
  name: string;
  index: number;
  lines: Line[];
}
interface SingleJob {
  name: string;
  steps: SingleStep[];
}
type AllSteps = SingleJob[];

export const loader = async ({ request, params }: DataFunctionArgs) => {
  const octokit = await getOctokit(request);

  const { owner, repo, id } = params;

  const attempt = await octokit.actions.getWorkflowRun({
    owner: owner!,
    repo: repo!,
    run_id: Number(id!),
  });

  const installationOctokit = await getInstallationOctokit(request);

  let logs: JobShape;
  try {
    logs = await getLogsForUrl(installationOctokit, attempt.data.logs_url);
  } catch (e) {
    console.error(e);
    const installationId = await getInstallationId(request);

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
const paleYellow = "#FFDC00";
const paleBlue = "#0074D9";

export function LineWithTimestamp({line: {line, timestamp}, showTimestamps}: {line: Line, showTimestamps: boolean}){
  if (showTimestamps) {
    return <span><span>
        <time dateTime={timestamp}>{timestamp}</time>
      </span>
      <ConstructLine line={line} />
      </span>
  } else {
      return       <ConstructLine line={line} />
  }
}

/**
 * See https://learn.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands?view=azure-devops&tabs=bash
 *
 * I guess GitHub Actions translates to the Azure syntax under the hood
 */
export function ConstructLine({ line }: { line: string }) {
  let directive: string = "";
  if (line.startsWith("##[")) {
    const parts = matchDirective(line);
    line = parts.line;
    directive = parts.directive;
  }

  switch (directive) {
    case "error":
      return <span style={{ color: paleRed }}>{line}</span>;
    case "warning":
      return <span style={{ color: paleYellow }}>{line}</span>;
    case "debug":
      return <span style={{ color: paleBlue }}>{line}</span>;
    case "section":
    case "group":
    case "command":
    case "endgroup":
    default: {
      const { spans } = ansicolor.parse(line!);

      return (
        <>
          {spans.map((dat) => (
            <span key={dat.text} style={parseCss(dat.css)}>
              {dat.text}
            </span>
          ))}
        </>
      );
    }
  }
}

function parseCss(css: string): Record<string, string> {
  return Object.fromEntries(
    css
      .split(";")
      .filter((rule) => rule.trim())
      .map((rule) => {
        const [key, value] = rule.split(":").map((rule) => rule.trim());

        const parts = key.split("-");
        const endKey = parts[0] + parts.slice(1).map(titleCase).join("");

        return [endKey, value];
      }),
  );
}

function Job({
  name,
  steps,
  showTimestamps,
}: {
  name: string;
  steps: SingleStep[];
  showTimestamps: boolean;
}) {
  const { open, getDetailsProps } = useDetails({});
  return (
    <Details {...getDetailsProps()}>
      <Summary open={open ?? false}>{name}</Summary>
      <ol>
        {steps
          .filter(({ lines }) => lines.length)
          .map(({ name, lines, index }) => (
            <li key={name} value={index}>
              <Step name={name} lines={lines} showTimestamps={showTimestamps} />
            </li>
          ))}
      </ol>
    </Details>
  );
}

function Step({
  name,
  lines,
  showTimestamps,
}: {
  name: string;
  lines: Line[];
  showTimestamps: boolean;
}) {
  const { open, getDetailsProps } = useDetails({});

  return (
    <Details {...getDetailsProps()}>
      <Summary open={open ?? false}>{name}</Summary>
      <PreStyle>
        <pre>
          <code>
            {lines.map((line, i) => (
              <span key={i}>
                <LineWithTimestamp line={line} showTimestamps={showTimestamps} />
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
  return {
    directive: res![1],
    line: res![2],
    original: line,
  };
}

function extractErrors(data: Line[]) {
  return data.filter(
    ({ line }) =>
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
          let lines = step.contents.map((line) => {
            const timestamp = line.substring(0, TIMESTAMP_LENGTH);
            return {
              timestamp,
              line: line.substring(TIMESTAMP_LENGTH + 1),
            };
          });

          lines = lines.filter((line) => !line.line.includes("##vso["));

          // TODO: move this filtering to the backend
          if (onlyErrors) {
            lines = extractErrors(lines);
          }

          return { name: step.name, lines, index: step.index };
        }),
      })),
    );
  }, [logs, onlyErrors]);

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
      {extracted.length ? (
        <ul>
          {extracted
            .filter(({ steps }) => steps.length)
            .map(({ name, steps }) => (
              <li key={name}>
                <Job
                  name={name}
                  steps={steps}
                  showTimestamps={showTimestamps}
                />
              </li>
            ))}
        </ul>
      ) : (
        <Box padding={2}>
          <Flash variant="warning">No logs to display</Flash>
        </Box>
      )}
    </>
  );
}
