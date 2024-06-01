import baseConfig from "@classroom/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["worker-configuration.d.ts"],
  },
  ...baseConfig,
];
