import { Button } from "@primer/react";
import {
  isRouteErrorResponse,
  useLocation,
  useNavigate,
  useRouteError,
} from "@remix-run/react";

export function ErrorBoundary() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    );
  } else if (error instanceof Error && error.message === "Failed to fetch") {
    return (
      <div>
        <h1>Page failed to load</h1>
        <Button onClick={() => navigate(pathname)}>Retry</Button>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>
          Error: <code>{error.name}</code>
        </h1>
        <p>
          <code>{error.message}</code>
        </p>
        <p>The stack trace is:</p>
        <pre>
          <code>{error.stack?.trim()}</code>
        </pre>
        <pre>
          <code>{JSON.stringify(splatObject(error), undefined, 2)}</code>
        </pre>
      </div>
    );
  } else {
    return (
      <div>
        <h1>Unknown Error</h1>
        <pre>
          <code>{JSON.stringify(error, undefined, 2)}</code>
        </pre>
      </div>
    );
  }
}

export const splatObject = (error: unknown) =>
  Object.assign(
    {},
    error,
    Object.fromEntries(
      Object.entries(Object.getOwnPropertyDescriptors(error)).map(
        ([key, descr]) => [key, descr.value]
      )
    )
  );
