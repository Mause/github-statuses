import { screen, render } from "@testing-library/react";

test("hello", async () => {
  const {default: BasePage} = await import("~/routes/index");
  const { createRemixStub } = await import("@remix-run/testing/dist/create-remix-stub");

  console.log({BasePage, createRemixStub})

  const Stub = createRemixStub([
    {
      Component: () => <BasePage asChildRoute={false} />,
    },
  ]);

  render(<Stub />);

  await screen.findByText("hello");
});
