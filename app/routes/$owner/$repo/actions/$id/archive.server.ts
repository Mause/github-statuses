import AdmZip from "adm-zip";
import _ from "lodash";
import { extname } from "path";

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

function extractName(name: string): string {
  return name.substring(0, name.length - extname(name).length);
}

export function processEntries(entries: AdmZip.IZipEntry[]): StepData[] {
  return _.chain(entries)
    .map((entry) => {
      const filename = entry.name;
      const [index, name] = filename.split("_", 1);
      return {
        name: extractName(name),
        filename,
        index: Number(index),
        contents: entry.getData().toString(),
      };
    })
    .sortBy((entry) => entry.index)
    .value();
}
