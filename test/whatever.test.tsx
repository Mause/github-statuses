import {
  configMocks,
  mockIntersectionObserver,
  mockResizeObserver,
} from "jsdom-testing-mocks";
import { act } from "react-dom/test-utils";
import { screen, render } from "@testing-library/react";
import { createRemixStub } from "@remix-run/testing";

import primer from "@primer/react";
const { BaseStyles, ThemeProvider } = primer;

configMocks({ act, beforeAll, beforeEach, afterEach, afterAll });
mockIntersectionObserver();
mockResizeObserver();

test("hello", async () => {
  let BasePage: React.FunctionComponent<{ asChildRoute: boolean }>;
  try {
    BasePage = (await import("~/routes/index")).default;
  } catch (e) {
    console.error(e);
    throw e;
  }

  const Stub = createRemixStub([
    {
      Component: () => (
        <ThemeProvider>
          <BaseStyles>
            <BasePage asChildRoute={false} />
          </BaseStyles>
        </ThemeProvider>
      ),
      loader: async () => ({ repos: [] }),
      path: "/",
      id: "root",
    },
  ]);

  render(<Stub />);

  await screen.findByText("Action Statuses");
});
