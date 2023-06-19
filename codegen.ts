import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "https://docs.github.com/public/schema.docs.graphql",
  documents: ["app/**/*.tsx", "app/**/*.ts"],
  generates: {
    "./app/components/graphql/": {
      preset: "client",
      config: {
        documentMode: "string",
        strictScalars: true,
        scalars: {
          Base64String: "string",
          Date: "string",
          DateTime: "string",
          BigInt: "string",
          GitObjectID: "string",
          GitRefname: "string",
          GitSSHRemote: "string",
          GitTimestamp: "string",
          HTML: "string",
          PreciseDateTime: "string",
          X509Certificate: "string",
          URI: "string",
          URL: "string",
        },
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
