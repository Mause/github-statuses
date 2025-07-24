export async function timeout<T>(t: Promise<T>) {
  return await Promise.race([
    t,
    new Promise((resolve) => {
      setTimeout(() => resolve("timed out"), 5000);
    }),
  ]);
}
