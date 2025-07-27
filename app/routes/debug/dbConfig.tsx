import { getConfig } from "~/services/cache";

export const loader = () => {
  return getConfig();
};
