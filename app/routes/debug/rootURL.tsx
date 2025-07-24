import { getRootURL } from "~/octokit.server";

export const loader = () => {
  return { rootURL: getRootURL() };
};
