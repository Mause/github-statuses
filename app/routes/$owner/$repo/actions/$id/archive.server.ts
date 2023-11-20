import AdmZip from "adm-zip";

export function getLogs(arrayBuffer: ArrayBuffer): [string, string][] {
  const buffer = Buffer.from(arrayBuffer);
  const zip = new AdmZip(buffer, { readEntries: true });

  let files = zip.getEntries();

  if (files.length === 0) {
    throw new Error("No files found");
  }

  return files
    .filter((file) => !file.isDirectory && !file.entryName.includes("/"))
    .map((file) => [file.entryName, file.getData().toString()]);
}
