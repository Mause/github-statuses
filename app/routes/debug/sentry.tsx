import * as Sentry from "@sentry/remix";

function getSentryDsn() {
  try {
    return Sentry.getCurrentScope().getClient()?.getDsn() ?? "no dsn found";
  } catch (e) {
    console.error("unable to get sentry", e);
    return `unable to get sentry: ${e}`;
  }
}

export const loader = () => {
  return {
    sentry: Promise.resolve(getSentryDsn()),
  };
};
