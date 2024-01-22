import {
  configMocks,
  mockIntersectionObserver,
  mockResizeObserver,
} from "jsdom-testing-mocks";
import { act } from "react-dom/test-utils";
import { screen, render } from "@testing-library/react";
import { createRemixStub } from "@remix-run/testing";
import { BaseStyles, ThemeProvider } from "@primer/react";
import BasePage from "~/routes/index";

configMocks({ act, beforeAll, beforeEach, afterEach, afterAll });
mockIntersectionObserver();
mockResizeObserver();

test("hello", async () => {
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
