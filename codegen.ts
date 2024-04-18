import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "https://docs.github.com/public/fpt/schema.docs.graphql",
  documents: ["app/**/*.tsx", "app/**/*.ts"],
  generates: {
    "./app/components/graphql/": {
      preset: "client",
      config: {
        documentMode: "string",
        defaultScalarType: "string",
      },
      presetConfig: {
        fragmentMasking: {
          unmaskFunctionName: "getFragment",
        },
      },
    },
  },
};
export default config;
