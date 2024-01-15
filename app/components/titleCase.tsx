const splitSentence = (
  sentence: string,
  transform = (word: string, i: number) => word,
) =>
  sentence
    ? sentence
        .toLowerCase()
        .split(/[_\- ]/)
        .map((word, i) => {
          switch (word) {
            case "duckdb":
              return "DuckDB";
            case "github":
              return "GitHub";
            default:
              return transform(word, i);
          }
        })
        .join(" ")
    : sentence;

const uppercase = (word: string) =>
  word.slice(0, 1).toUpperCase() + word.slice(1);

export const titleCase = (conclusion: string) =>
  splitSentence(conclusion, uppercase);

export const sentenceCase = (str: string) =>
  splitSentence(str, (word, i) => (i === 0 ? uppercase(word) : word));
