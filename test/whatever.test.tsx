import { screen, render } from "@testing-library/react";

test("hello", async () => {
  let BasePage: React.FunctionComponent<{asChildRoute: boolean}>;
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
      loader: () => Promise.resolve({}),
    },
  ]);

  render(<Stub />);

  await screen.findByText("Unexpected Application Error!");
});
