import AdmZip from "adm-zip";
import _ from "lodash";
import { extname } from "path";
import type { Octokit } from "@octokit/rest";

export type Job = { [jobName: string]: StepData[] };

export async function getLogsForUrl(
  octokit: Octokit,
  url: string,
): Promise<Job> {
  let log_zip;
  try {
    log_zip = await octokit.request(url, {
      mediaType: {
        format: "raw",
      },
    });
  } catch (e) {
    throw new CausedError(`Failed to get logs for ${url}`, e as Error);
  }

  return await getLogs(log_zip.data as ArrayBuffer);
}

export class CausedError extends Error {
  constructor(
    message: string,
    public cause: Error,
  ) {
    super(message);
    this.name = "CausedError";
  }
}
export interface HttpError extends Error {
  request: Request;
  response: Response;
}
const isWhat = (name: string, e: unknown) =>
  (typeof e === "object" && e && "name" in e && e.name == name) ?? false;
export function isCausedError(e: unknown): e is CausedError {
  return isWhat("CausedError", e);
}
export function isHttpError(e: unknown): e is HttpError {
  return isWhat("HttpError", e);
}

export function getLogs(arrayBuffer: ArrayBuffer): Job {
  const buffer = Buffer.from(arrayBuffer);
  const zip = new AdmZip(buffer, { readEntries: true });

  const files = _.groupBy(
    zip
      .getEntries()
      .filter((entry) => !entry.isDirectory && entry.entryName.includes("/")),
    (entry) => entry.entryName.split("/")[0],
  );

  if (Object.keys(files).length === 0) {
    throw new Error("No files found");
  }

  return Object.fromEntries(
    _.map(files, (entries, job) => [job, processEntries(entries)]),
  );
}

export interface StepData {
  name: string;
  filename: string;
  index: number;
  contents: string[];
}

function extractName(name: string): string {
  return name.substring(0, name.length - extname(name).length);
}

export function processEntries(entries: AdmZip.IZipEntry[]): StepData[] {
  return _.chain(entries)
    .map((entry) => {
      const filename = entry.name;
      const [index, name] = filename.split("_", 2);
      return {
        name: extractName(name),
        filename,
        index: Number(index),
        contents: entry.getData().toString().split("\n"),
      };
    })
    .sortBy((entry) => entry.index)
    .value();
}
