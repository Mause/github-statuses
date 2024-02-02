import { BaseStyles, ThemeProvider } from "@primer/react";
import { act, render } from "@testing-library/react";

export async function renderPrimer(node: JSX.Element) {
  return await act(() =>
    render(
      <ThemeProvider>
        <BaseStyles>{node}</BaseStyles>
      </ThemeProvider>,
    ),
  );
}
