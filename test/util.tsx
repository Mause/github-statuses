import { BaseStyles, ThemeProvider } from "@primer/react";
import { act, render } from "@testing-library/react";
import type { ReactElement } from "react";

export async function renderPrimer(node: ReactElement) {
  return await act(() =>
    render(
      <ThemeProvider>
        <BaseStyles>{node}</BaseStyles>
      </ThemeProvider>,
    ),
  );
}
