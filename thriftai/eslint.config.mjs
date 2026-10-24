import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Legacy agents and the routes that use them are replaced in backend phase B5
    // (docs/rpi/02-PLAN-BACKEND.md). Don't extend these files; new code must pass the full rules.
    files: [
      "src/lib/agents/**",
      "src/app/api/v1/conversation/**",
      "src/app/api/v1/products/compare/**",
      "src/app/api/v1/products/[[]id]/explain/**",
    ],
    rules: { "@typescript-eslint/no-explicit-any": "off" },
  },
  {
    // Jest loads these as CommonJS.
    files: ["jest.config.js", "jest.setup.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    ignores: [
      ".veritas/**",
      "node_modules/**",
      ".next/**",
      ".next-check/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
