import { nodeProfilingIntegration } from "@sentry/profiling-node";
import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1,
  autoInstrumentRemix: true,
});
