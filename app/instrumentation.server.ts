import { nodeProfilingIntegration } from "@sentry/profiling-node";
import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: (window as any).ENV.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1,
  autoInstrumentRemix: true,
});
