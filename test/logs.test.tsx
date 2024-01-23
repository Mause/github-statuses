import { render } from "@testing-library/react";
import {
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

  it("lineWithTimestamp", () => {
    let el = render(
      <LineWithTimestamp
        line={{
          line: "hello world",
          timestamp: "2022-01-01T22:00",
        }}
        showTimestamps={true}
      />,
    );
    expect(el.container).toMatchSnapshot();

    el = render(
      <LineWithTimestamp
        line={{
          line: "hello world",
          timestamp: "2022-01-01T22:00",
        }}
        showTimestamps={false}
      />,
    );
    expect(el.container).toMatchSnapshot();
  });
});
