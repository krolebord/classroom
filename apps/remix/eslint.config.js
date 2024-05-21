import baseConfig from "@classroom/eslint-config/base";
import reactConfig from "@classroom/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["build"],
  },
  ...baseConfig,
  ...reactConfig,
];
