const splitSentence = (sentence: string) =>
  sentence.toLowerCase().split(/[_- ]/);

const uppercase = (word: string) =>
  word.slice(0, 1).toUpperCase() + word.slice(1);

export const titleCase = (conclusion: string) =>
  splitSentence(conclusion)
    .map((word) => (word === "DuckDB" ? word : uppercase(word)))
    .join(" ");

export const sentenceCase = (str: string) =>
  str ? uppercase(splitSentence(str).join(" ")) : str;
