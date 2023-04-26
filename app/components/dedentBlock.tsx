import _ from "lodash";

const _whitespace_only_re = /^[ \t]+$/gm;
const _leading_whitespace_re = /(^[ \t]*)(?:[^ \t\n])/gm;

export function dedent(text: string) {
  `Remove any common leading whitespace from every line in \`text\`.

    This can be used to make triple-quoted strings line up with the left
    edge of the display, while still presenting them in the source code
    in indented form.

    Note that tabs and spaces are both treated as whitespace, but they
    are not equal: the lines "  hello" and "\\thello" are
    considered to have no common leading whitespace.

    Entirely blank lines are normalized to a newline character.
    `;
  // Look for the longest leading string of spaces and tabs common to
  // all lines.
  let margin = null;
  text = text.replaceAll(_whitespace_only_re, "");

  let indents = Array.from(text.matchAll(_leading_whitespace_re)).map(
    (arr) => arr[1]
  );
  for (let indent of indents) {
    if (margin === null) {
      margin = indent;
    }

    // Current line more deeply indented than previous winner:
    // no change (previous winner is still on top).
    else if (indent.startsWith(margin)) {
    }

    // Current line consistent with and no deeper than previous winner:
    // it's the new winner.
    else if (margin.startsWith(indent)) {
      margin = indent;
    }

    // Find the largest common whitespace between current line and previous
    // winner.
    else {
      let i = 0;
      for (const [x, y] of _.zip(margin, indent)) {
        if (x != y) {
          margin = margin.substring(0, i);
          break;
        }
        i++;
      }
    }
  }

  if (margin) {
    text = text.replaceAll(new RegExp("^" + margin, "gm"), "");
  }
  return text;
}
export const dedentBlock = (text: TemplateStringsArray) =>
  dedent(text.join("\n"));
