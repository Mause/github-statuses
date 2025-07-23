import * as Sentry from "@sentry/remix";
import { registerOTel } from '@vercel/otel';
 
registerOTel({ serviceName: 'github-statuses' });

Sentry.init({
  dsn: "https://fb814bfc76ad4564ab13b629de969706@o337133.ingest.us.sentry.io/4504964814929920",
  tracesSampleRate: 1,
});
