import { render } from "@testing-library/react";
import { ConstructLine } from "~/routes/$owner/$repo/actions/$id/logs";

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
});
