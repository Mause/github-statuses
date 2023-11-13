import { MarkdownViewer } from "@primer/react/drafts";
//  @ts-ignore
import darkStyle from "github-syntax-dark/lib/github-dark.css";
//  @ts-ignore
import lightStyle from "github-syntax-light/lib/github-light.css";
import { themeGet, useTheme } from "@primer/react";
import styled from "styled-components";

const PreStyle = styled.pre`
  pre {
    border-radius: 5px;
    padding: 0.5em;
    border: ${themeGet("borderWidths.1")} ${themeGet("colors.border.default")}
      solid;
  }
`;

export function Markdown({ rendered }: { rendered: string }) {
  const theme = useStylesheet();

  return (
    <>
      <link rel="stylesheet" href={theme} />
      <PreStyle>
        <MarkdownViewer dangerousRenderedHTML={{ __html: rendered }} />
      </PreStyle>
    </>
  );
}

function useStylesheet() {
  const { resolvedColorMode } = useTheme();

  return resolvedColorMode === "dark" || resolvedColorMode == "night"
    ? darkStyle
    : lightStyle;
}
