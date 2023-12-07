import { titleCase, sentenceCase } from "~/components/titleCase";

describe("cases", () => {
  it("titleCase", () => {
    expect(titleCase("hello world")).toBe("Hello World");
    expect(titleCase("hello-world")).toBe("Hello World");
    expect(titleCase("hello_world")).toBe("Hello World");
    expect(titleCase("Duckdb labs")).toBe("DuckDB Labs");
    expect(titleCase("github actions")).toBe("GitHub Actions");
  });
  it("sentenceCase", () => {
    expect(sentenceCase("hello world")).toBe("Hello world");
    expect(sentenceCase("hello-world")).toBe("Hello world");
    expect(sentenceCase("hello_world")).toBe("Hello world");
    expect(sentenceCase("Duckdb labs")).toBe("DuckDB labs");
    expect(sentenceCase("github actions")).toBe("GitHub actions");
  });
});
