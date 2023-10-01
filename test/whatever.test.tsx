import { unstable_createRemixStub as createRemixStub } from "@remix-run/testing";
import { act } from "@testing-library/react";
import BasePage from "../app/routes/index";

describe("base", () => {
  test("hello", async () => {
    const Stub = createRemixStub([
      {
        Component: () => <BasePage asChildRoute={false} />,
      },
    ]);

    await act(() => <Stub />);
  });
});
