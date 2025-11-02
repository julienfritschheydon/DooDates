import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { 
    ignores: [
      "dist/**",
      "build/**",
      "coverage/**",
      "node_modules/**",
      "tests/**/*",
      "quick-test.js",
      "**/*.d.ts",
      "vite.config.ts.timestamp-*",
      "playwright-report/**",
      "test-results/**"
    ] 
  },
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
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unused-expressions": ["warn", { 
        allowShortCircuit: true, 
        allowTernary: true 
      }],
      "no-useless-escape": "warn",
      "no-empty": "warn",
      "no-prototype-builtins": "warn",
      "no-case-declarations": "warn",
      "no-constant-binary-expression": "warn",
      "no-unused-expressions": "off", // Désactiver la règle de base au profit de @typescript-eslint
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "warn",
      "react-refresh/only-export-components": "warn",
    },
  }
);
