import "@testing-library/jest-dom";
import { createRemixStub } from "@remix-run/testing";
import { act, render, waitFor } from "@testing-library/react";
import Deferred, { loader } from "~/routes/storybook/deferred";

describe("Deferred", () => {
  it("renders the deferred data after 3 seconds", async () => {
    const Stub = createRemixStub([
      {
        path: "/",
        loader,
        Component: Deferred,
        id: "root",
      },
    ]);

    const { getByTestId } = await act(() => render(<Stub />));
    expect(getByTestId("immediate")).toHaveTextContent(
      "this data is available immediately",
    );
    expect(getByTestId("deferred")).toHaveTextContent("...");
    await waitFor(
      () =>
        expect(getByTestId("deferred")).toHaveTextContent(
          "this data is available after 3 seconds",
        ),
      {
        timeout: 5000,
      },
    );
  });
});
