import _ from "lodash";

export const loader = () => {
  return {
    env: _.pick(process.env, ["VERCEL_ENV", "HOSTNAME", "VERCEL_URL", "PORT"]),
  };
};
