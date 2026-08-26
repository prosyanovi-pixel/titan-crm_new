import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
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
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/ban-ts-comment": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "no-useless-escape": "warn",
    },
  },
  {
    files: ["src/modules/contractors/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/modules/tasks",
                "@/modules/tasks/*",
                "@/modules/projects",
                "@/modules/projects/*",
                "@/modules/lawyers",
                "@/modules/lawyers/*",
              ],
              message:
                "Модуль contractors не должен напрямую импортировать feature-модули tasks/projects/lawyers. Используйте orchestration на app-уровне.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/modules/tasks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/modules/projects",
                "@/modules/projects/*",
                "@/modules/lawyers",
                "@/modules/lawyers/*",
              ],
              message:
                "Модуль tasks не должен зависеть от feature-модулей projects/lawyers. Используйте shared-контракты и orchestration.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/modules/projects/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/modules/tasks",
                "@/modules/tasks/*",
                "@/modules/lawyers",
                "@/modules/lawyers/*",
              ],
              message:
                "Модуль projects не должен зависеть от feature-модулей tasks/lawyers. Используйте orchestration на app-уровне.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/modules/lawyers/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/modules/tasks",
                "@/modules/tasks/*",
                "@/modules/projects",
                "@/modules/projects/*",
              ],
              message:
                "Модуль lawyers не должен зависеть от feature-модуля tasks/projects. Используйте orchestration и shared DTO.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/App.tsx", "src/routes/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/pages/*"],
              message:
                "В App и routes используйте публичные entry-points модулей (index.ts), а не deep-import из pages.",
            },
          ],
        },
      ],
    },
  },
);
