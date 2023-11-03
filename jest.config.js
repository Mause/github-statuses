import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  moduleNameMapper: {
    ".*\\.css$": "<rootDir>/test/CSSStub.js",
    "^~/(.*)$": "<rootDir>/app/$1",
  },
  testEnvironment: "node",
};
