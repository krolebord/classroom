/*
 * This file is not used for any compilation purpose, it is only used
 * for Tailwind Intellisense & Autocompletion in the source files
 */
import type { Config } from "tailwindcss";

import baseConfig from "@classroom/tailwind-config/web";

export default {
  presets: [baseConfig],
  content: ["./app/**/*.{js,jsx,ts,tsx}", "../../packages/ui/**/*.{ts,tsx}"],
} satisfies Config;
