export default [
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { console: "readonly", process: "readonly", crypto: "readonly", fetch: "readonly", document: "readonly", window: "readonly" }
    },
    rules: { "no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^React$", "caughtErrorsIgnorePattern": "^error$" }] }
  }
];
