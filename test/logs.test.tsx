import { render } from "@testing-library/react";
import {
  ConfigContext,
  ConstructLine,
  LineWithTimestamp,
} from "~/routes/$owner/$repo/actions/$id/logs";
import { RequestError } from "@octokit/request-error";
import {
  CausedError,
  isCausedError,
  isHttpError,
} from "~/services/archive.server";
import type { OctokitResponse } from "@octokit/types";

describe("constructLine", () => {
  it("error", () => {
    const el = render(<ConstructLine line="##[error]Error message" />);

    expect(el.container).toMatchSnapshot();
  });

  it("ansi colors", () => {
    const line = "\u001b[36;1moptions(crayon.enabled = TRUE)\u001b[0m";
    const el = render(<ConstructLine line={line} />);

    expect(el.container).toMatchSnapshot();
  });

  describe("lineWithTimestamp", () => {
    for (const showTimestamps of [true, false]) {
      it(showTimestamps.toString(), () => {
        const el = render(
          <ConfigContext.Provider value={{ showTimestamps }}>
            <LineWithTimestamp
              line={{
                line: "hello world",
                timestamp: "2022-01-01T22:00",
              }}
            />
          </ConfigContext.Provider>,
        );
        expect(el.container).toMatchSnapshot();
      });
    }
  });

  it("CausedError and HttpError", () => {
    let response = {} as OctokitResponse<unknown>;
    const hello = new CausedError(
      "hello",
      new RequestError("message", 404, {
        request: {
          method: "GET",
          headers: {},
          url: "",
        },
        response,
      }),
    );

    expect(isCausedError(hello)).toEqual(true);
    expect(isHttpError(hello.cause)).toEqual(true);
  });
});
