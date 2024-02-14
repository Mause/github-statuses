// @ts-check
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'plugin:react/recommended',
    'standard-with-typescript',
    // "plugin:primer-react/recommended",
    'eslint:recommended',
    'plugin:@typescript-eslint/strict-type-checked'
  ],
  settings: {
    react: {
      version: 'detect'
    }
  },
  overrides: [],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.eslint.json',
    tsconfigRootDir: __dirname
  },
  parser: '@typescript-eslint/parser',
  plugins: ['react', '@typescript-eslint'],
  root: true
}
