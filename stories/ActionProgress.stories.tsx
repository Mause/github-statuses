import { ThemeProvider } from "@primer/react";
import type { Meta, StoryObj } from "@storybook/react";
import { ActionProgress } from "~/components/ActionProgress";

const meta = {
  title: "Example/ActionProgress",
  component: ActionProgress,
  render(args) {
    return (
      <ThemeProvider>
        <ActionProgress {...args} />
      </ThemeProvider>
    );
  },
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    progress: {
      type: "number",
    },
    counts: {
      type: {
        name: "object",
        value: {},
      },
    },
  },
} satisfies Meta<typeof ActionProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedIn: Story = {
  args: {
    counts: {
      IN_PROGRESS: 5,
      SUCCESS: 10,
    },
    progress: (10 / 15) * 100,
  },
};

export const LoggedOut: Story = {
  args: {
    counts: {
      IN_PROGRESS: 5,
      FAILED: 5,
      SUCCESS: 5,
    },
    progress: (5 / 15) * 100,
  },
};

export const about = { content: <div>Hello world</div> };
