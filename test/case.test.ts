import { titleCase, sentenceCase } from "~/components/titleCase";

describe("cases", () => {
  it("titleCase", () => {
    expect(titleCase("hello world")).toBe("Hello World");
    expect(titleCase("hello-world")).toBe("Hello World");
    expect(titleCase("hello_world")).toBe("Hello World");
    expect(titleCase("Duckdb")).toBe("DuckDB");
  });
  it("sentenceCase", () => {
    expect(sentenceCase("hello world")).toBe("Hello world");
    expect(sentenceCase("hello-world")).toBe("Hello world");
    expect(sentenceCase("hello_world")).toBe("Hello world");
    expect(sentenceCase("Duckdb")).toBe("DuckDB");
  });
});
