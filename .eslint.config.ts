import { Linter } from "eslint";

const config: Linter.Config = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
    project: "./tsconfig.json", // Ensure TypeScript config is set
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    "prettier/prettier": "error", // Enforce Prettier formatting
    "no-unused-vars": "warn", // Warn on unused variables
    "no-console": "warn", // Avoid unnecessary console logs
    "@typescript-eslint/no-explicit-any": "error", // Prevent `any` type usage
    "@typescript-eslint/explicit-module-boundary-types": "warn", // Encourage explicit return types
    "@typescript-eslint/ban-ts-comment": "warn", // Warn on using ts-ignore comments
    "prefer-const": "error", // Enforce using `const` when possible
    "no-var": "error", // Prevent usage of `var`
    "eqeqeq": ["error", "always"], // Require `===` and `!==`
    "curly": ["error", "all"], // Enforce curly braces on all control statements
  },
  env: {
    browser: true,
    node: true,
    es2020: true,
  },
};

export default config;
