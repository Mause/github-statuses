import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "https://docs.github.com/public/schema.docs.graphql",
  documents: ["app/**/*.tsx"],
  generates: {
    "./app/components/graphql/": {
      preset: "client",
    },
  },
};
export default config;
