import { nodeProfilingIntegration } from "@sentry/profiling-node";
import * as Sentry from "@sentry/remix";
import { registerOTel } from '@vercel/otel';
 
registerOTel({ serviceName: 'github-statuses' });

console.log("Sentry is starting...");
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1,
});
