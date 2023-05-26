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
        <h1>Error: {error.name}</h1>
        <Button onClick={() => navigate(pathname)}>Revalidate</Button>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error: {error.name}</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <code>
          <pre>{error.stack?.trim()}</pre>
        </code>
        <code>
          <pre>{JSON.stringify(splatObject(error), undefined, 2)}</pre>
        </code>
      </div>
    );
  } else {
    return (
      <div>
        <h1>Unknown Error</h1>
        <code>
          <pre>{JSON.stringify(error, undefined, 2)}</pre>
        </code>
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
