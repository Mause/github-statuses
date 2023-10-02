import { screen, render } from "@testing-library/react";

test("hello", async () => {
  let BasePage;
  try {
    BasePage = (await import("~/routes/index")).default;
  } catch (e) {
    console.error(e)
  }
  console.log(BasePage);
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
