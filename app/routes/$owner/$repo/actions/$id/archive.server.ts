import AdmZip from "adm-zip";
import { extractName } from "./logs";
import _ from "lodash";

export function getLogs(arrayBuffer: ArrayBuffer): {
  [jobName: string]: StepData[];
} {
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
  contents: string;
}

export function processEntries(entries: AdmZip.IZipEntry[]): StepData[] {
  return _.chain(entries)
    .map((entry) => {
      const name = entry.name;
      const parts = name.split("_");
      return {
        name: extractName(name),
        filename: name,
        index: Number(parts[0]),
        contents: entry.getData().toString(),
      };
    })
    .sortBy((entry) => entry.index)
    .value();
}
