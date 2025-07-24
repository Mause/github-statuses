export async function timeout<T>(t: Promise<T>, name: string) {
  return await Promise.race([
    t,
    new Promise((resolve) => {
      setTimeout(
        () =>
          resolve({
            message: `timed out: ${name}`,
            stack: new Error().stack,
          }),
        5000,
      );
    }),
  ]);
}
