export const loader = () => {
  const { env } = process;
  return {
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
    latencyLogging: true,
  };
};
