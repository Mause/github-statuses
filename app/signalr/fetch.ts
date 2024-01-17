export async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      // credentials: 'same-origin',
      headers: {
        cookie: process.env.GITHUB_COOKIE!,
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error(e);
    // Network failure
  }
  return null;
}
