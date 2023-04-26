import { MarkdownViewer } from "@primer/react/drafts";
import { Suspense } from "react";
//  @ts-ignore
import darkStyle from "github-syntax-dark/lib/github-dark.css";
//  @ts-ignore
import lightStyle from "github-syntax-light/lib/github-light.css";
import { useTheme } from "@primer/react";

export function Markdown({ rendered }: { rendered: string }) {
  const theme = useStylesheet();

  return (
    <Suspense fallback={<pre dangerouslySetInnerHTML={{ __html: rendered }} />}>
      <link rel="stylesheet" href={theme} />
      <style
        children={`pre { border-radius: 5px; border: 1px black solid; }`}
      />
      <MarkdownViewer dangerousRenderedHTML={{ __html: rendered }} />
    </Suspense>
  );
}
function useStylesheet() {
  const { colorMode } = useTheme();

  return colorMode === "dark" || colorMode == "night" ? darkStyle : lightStyle;
}
