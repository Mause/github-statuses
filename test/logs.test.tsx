import { render } from "@testing-library/react";
import {
  ConfigContext,
  ConstructLine,
  LineWithTimestamp,
} from "~/routes/$owner/$repo/actions/$id/logs";

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

  it("lineWithTimestamp(true)", () => {
    const el = render(
      <ConfigContext.Provider
        value={{
          showTimestamps: true,
        }}
      >
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
  it("lineWithTimestamp(false)", () => {
    const el = render(
      <ConfigContext.Provider value={{ showTimestamps: false }}>
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
});
