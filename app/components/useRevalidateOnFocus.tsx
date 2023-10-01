import { useEffect } from "react";
import { useRevalidator, useLoaderData } from "@remix-run/react";

export function useLoaderDataReloading<T>() {
  useRevalidateOnFocus();
  const result = useLoaderData<T>();

  if (typeof result === "string") {
    throw new Error(result);
  } else {
    return result;
  }
}

export function useRevalidateOnFocus() {
  const { revalidate } = useRevalidator();

  useEffect(
    function revalidateOnFocus() {
      function onFocus() {
        revalidate();
      }
      window.addEventListener("focus", onFocus);
      return () => window.removeEventListener("focus", onFocus);
    },
    [revalidate],
  );

  useEffect(
    function revalidateOnVisibilityChange() {
      function onVisibilityChange() {
        revalidate();
      }
      window.addEventListener("visibilitychange", onVisibilityChange);
      return () =>
        window.removeEventListener("visibilitychange", onVisibilityChange);
    },
    [revalidate],
  );
}
