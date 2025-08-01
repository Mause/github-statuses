import { type LoaderFunctionArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import type { Job as JobShape } from "~/services/archive.server";
import {
  getLogsForUrl,
  isCausedError,
  isHttpError,
} from "~/services/archive.server";
import {
  getInstallationOctokit,
  getInstallationId,
} from "~/services/installation";
import * as asc from "ansi-sequence-parser";
import { GearIcon } from "@primer/octicons-react";
import {
  Flash,
  IconButton,
  Details,
  ToggleSwitch,
  themeGet,
  FormControl,
  useDetails,
  Box,
} from "@primer/react";
import styled from "styled-components";
import type { CSSProperties } from "react";
import { useMemo, createContext, useContext, useState } from "react";
import _ from "lodash";
import { getOctokit } from "~/octokit.server";
import { splatObject } from "~/components";

export const PreStyle = styled.pre`
  pre {
    border-radius: 5px;
    padding: 0.5em;
    border: ${themeGet("borderWidths.1")} ${themeGet("colors.border.default")}
      solid;
  }
`;

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

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
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

    let status = "unknown";
    if (isCausedError(e) && isHttpError(e.cause)) {
      status = e.cause.response.statusText;
    }

    return json({
      message: `Logs not found (${status}). This installation probably doesn't have access`,
      url,
      error: splatObject(e),
    });
  }

  return json({ logs });
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

export const ConfigContext = createContext({ showTimestamps: false });
ConfigContext.displayName = "ConfigContext";

export function LineWithTimestamp({
  line: { line, timestamp },
}: {
  line: Line;
}) {
  const { showTimestamps } = useContext(ConfigContext);

  if (showTimestamps) {
    return (
      <span>
        <time dateTime={timestamp}>{timestamp}</time>
        &nbsp;
        <ConstructLine line={line} />
      </span>
    );
  } else {
    return <ConstructLine line={line} />;
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
      const spans = asc.parseAnsiSequences(line!);

      return (
        <>
          {spans.map((dat) => (
            <span key={dat.value} style={parseCss(dat)}>
              {dat.value}
            </span>
          ))}
        </>
      );
    }
  }
}

const colorPalette = asc.createColorPalette();

function parseCss(css: asc.ParseToken): CSSProperties {
  const toColor = (color: asc.Color | null) => {
    return color ? colorPalette.value(color) : undefined;
  };

  const outCss: CSSProperties = {
    color: toColor(css.foreground),
    backgroundColor: toColor(css.background),
  };

  for (const deco of css.decorations) {
    switch (deco) {
      case "bold":
        outCss.fontWeight = "bolder";
        break;
      case "italic":
        outCss.fontStyle = "italic";
        break;
      case "underline":
        outCss.textDecoration = "underline";
        break;
      case "strikethrough":
        outCss.textDecoration = "line-through";
        break;
      case "dim":
        outCss.opacity = 0.5;
        break;
    }
  }

  return outCss;
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

function Step({ name, lines }: { name: string; lines: Line[] }) {
  const { open, getDetailsProps } = useDetails({});

  return (
    <Details {...getDetailsProps()}>
      <Summary open={open ?? false}>{name}</Summary>
      <PreStyle>
        <pre>
          <code>
            {lines.map((line, i) => (
              <span key={i}>
                <LineWithTimestamp line={line} />
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
  const logs = "logs" in data ? data.logs : {};

  const extracted = useMemo(
    () =>
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

          lines = lines.filter(({ line }) => !line.includes("##vso["));

          // TODO: move this filtering to the backend
          if (onlyErrors) {
            lines = extractErrors(lines);
          }

          return { name: step.name, lines, index: step.index };
        }),
      })),
    [logs, onlyErrors],
  );

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
            aria-label="Installation settings"
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
      <ConfigContext.Provider value={{ showTimestamps }}>
        {extracted.length ? (
          <ul>
            {extracted
              .filter(({ steps }) => steps.length)
              .map(({ name, steps }) => (
                <li key={name}>
                  <Job name={name} steps={steps} />
                </li>
              ))}
          </ul>
        ) : (
          <Box padding={2}>
            <Flash variant="warning">No logs to display</Flash>
          </Box>
        )}
      </ConfigContext.Provider>
    </>
  );
}
