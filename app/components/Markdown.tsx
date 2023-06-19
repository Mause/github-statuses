import { MarkdownViewer } from "@primer/react/drafts";
//  @ts-ignore
import darkStyle from "github-syntax-dark/lib/github-dark.css";
//  @ts-ignore
import lightStyle from "github-syntax-light/lib/github-light.css";
import { useTheme } from "@primer/react";

export function Markdown({ rendered }: { rendered: string }) {
  const theme = useStylesheet();

  return (
    <>
      <link rel="stylesheet" href={theme} />
      <style
        children={`pre { border-radius: 5px; border: 1px black solid; }`}
      />
      <MarkdownViewer dangerousRenderedHTML={{ __html: rendered }} />
    </>
  );
}
function useStylesheet() {
  const { colorMode } = useTheme();

  return colorMode === "dark" || colorMode == "night" ? darkStyle : lightStyle;
}
