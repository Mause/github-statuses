export async function catchError<T>(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (e) {
    return e as T;
  }
  throw new Error("Expected an error to be thrown.");
}
