import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "tests/**/*", "quick-test.js"] }, // Ignore test files and standalone scripts
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn", // Downgrade to warning
      "@typescript-eslint/ban-ts-comment": "warn", // Downgrade to warning
      "@typescript-eslint/no-require-imports": "warn", // Downgrade to warning
      "@typescript-eslint/no-empty-object-type": "warn", // Downgrade to warning
      "no-useless-escape": "warn", // Downgrade to warning
      "no-empty": "warn", // Downgrade to warning
      "no-prototype-builtins": "warn", // Downgrade to warning
      "no-case-declarations": "warn", // Downgrade to warning
      "no-constant-binary-expression": "warn", // Downgrade to warning
      "react-hooks/exhaustive-deps": "warn", // Already a warning
      "react-hooks/rules-of-hooks": "warn", // Downgrade to warning
      "react-refresh/only-export-components": "warn", // Already a warning
    },
  }
);
