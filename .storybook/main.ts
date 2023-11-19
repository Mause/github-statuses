import type { StorybookConfig } from "@storybook/react-webpack5";

import TsconfigPathsPlugin from "tsconfig-paths-webpack-plugin";

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-webpack5",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  webpackFinal: async (config) => {
    const resolve = config?.resolve;

    console.log(resolve);
    if (resolve) {
      // @ts-ignore
      Object.assign(resolve.fallback, {
        os: false,
        stream: false,
        fs: false,
        "fs/promises": false,
      });
      resolve.plugins = [
        ...(resolve!.plugins || []),
        new TsconfigPathsPlugin({
          extensions: config?.resolve?.extensions,
        }),
      ];
    }
    return config;
  },
};
export default config;
