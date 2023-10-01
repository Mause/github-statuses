import { unstable_createRemixStub as createRemixStub } from "@remix-run/testing";
import { screen, render } from "@testing-library/react";
import BasePage from "../app/routes/index";

describe("base", () => {
  test("hello", async () => {
    const Stub = createRemixStub([
      {
        Component: () => <BasePage asChildRoute={false} />,
      },
    ]);

    render(<Stub />);

    await screen.findByText("hello");
  });
});
