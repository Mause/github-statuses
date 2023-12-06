import { constructLine } from "~/routes/$owner/$repo/actions/$id/logs";

describe("constructLine", () => {
  it("error", () => {
    const el = constructLine("##[error]Error message");

    expect(typeof el).toEqual("object");
    expect(el.type).toEqual("span");
    expect(el.props).toEqual({
      children: "Error message",
      style: {
        color: "#ff5353",
      },
    });
    expect(el.key).toEqual(null);
  });

  it("ansi colors", () => {
    const line = "\u001b[36;1moptions(crayon.enabled = TRUE)\u001b[0m";
    const el = constructLine(line);

    expect(typeof el).toEqual("object");
    expect(el.type).toEqual(Symbol.for("react.fragment"));

    const span = el.props.children[0];
    expect(span.type).toEqual("span");
    expect(span.props).toEqual({
      children: "options(crayon.enabled = TRUE)",
      style: {
        color: "rgba(0,204,255,1)",
        "font-weight": "bold",
      },
    });
  });
});
