import { constructLine } from "~/routes/$owner/$repo/actions/$id/logs";

describe("constructLine", () => {
  test("error", () => {
    const el = constructLine("##[error]Error message");

    if (typeof el === "object") {
      expect(el.type).toEqual("span");
      expect(el.props).toEqual({
        children: "Error message",
        style: {
          color: "#ff5353",
        },
      });
      expect(el.key).toEqual(null);
    } else {
      fail();
    }
  });
});
