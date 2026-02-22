import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.git/**",
      "**/.next/**",
      "**/dist/**",
      "**/coverage/**",
      "**/.turbo/**",
      "**/playwright-report/**",
      "**/test-results/**"
    ]
  },
  ...tseslint.config({
    files: ["**/*.{ts,tsx}"],
    extends: [...tseslint.configs.recommended],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSUnknownKeyword",
          message: "Explicit TypeScript 'unknown' is banned in this repo."
        }
      ]
    }
  })
];
