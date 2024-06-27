import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: (window as any).ENV.SENTRY_DSN,
  tracesSampleRate: 1,
  autoInstrumentRemix: true,
});
