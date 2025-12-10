import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "out/**",
      "coverage/**",
      ".coverage/**",
      "data/**",
      "outputs/**",
      "logs/**",
      "*.db",
      "*.db-journal",
      "*.db-shm",
      "*.db-wal",
      "next-env.d.ts",
      "src/lib/__tests__/test-utils.ts",
      "src/test-setup.ts"
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Add any custom rules here
    },
  },
];

export default eslintConfig;

