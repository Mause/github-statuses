export const REDIRECT_URL = "redirect_url";

export function queryParams(url: string, p: Record<string, string>) {
  const DUMMY = "http://dummy";
  let thing: URL;
  try {
    thing = new URL(url, DUMMY);
  } catch (e) {
    throw new Error(
      JSON.stringify({ url, endUrl: `${DUMMY}/${url}`, e, DUMMY }),
    );
  }
  appendQueryParams(p, thing);
  const res = thing.toString();
  return res.startsWith(DUMMY) ? res.substring(DUMMY.length) : res;
}

export function appendQueryParams(p: Record<string, string>, thing: URL) {
  for (const [key, value] of Object.entries(p)) {
    thing.searchParams.append(key, value);
  }
}
export function urlWithRedirectUrl(url: string, qs: URLSearchParams) {
  return queryParams(url, { [REDIRECT_URL]: qs.get(REDIRECT_URL)! });
}
