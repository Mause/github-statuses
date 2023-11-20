import { constructLine } from "./logs";

test("basic", () => {
  const res = constructLine(
    "##vso[task.setvariable variable=testvar;]testvalue",
  );

  if (typeof res === "string") {
    expect(JSON.parse(res)).toEqual({
      isVSO: true,
      directive: "task.setvariable variable=testvar;",
      line: "testvalue",
      original: "##vso[task.setvariable variable=testvar;]testvalue",
    });
  } else {
    fail();
  }
});
