import { constructLine } from "./logs";

describe("constructLine", () => {
  test("vso", () => {
    runTest("##vso[task.setvariable variable=testvar;]testvalue");
  });
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

function runTest(inputString: string) {
  const res = constructLine(inputString);

  if (typeof res === "string") {
    expect(JSON.parse(res)).toEqual({
      isVSO: true,
      directive: "task.setvariable variable=testvar;",
      line: "testvalue",
      original: inputString,
    });
  } else {
    fail(inputString);
  }
}
