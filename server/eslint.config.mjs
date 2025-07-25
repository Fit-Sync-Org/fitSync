import globals from "globals";
import { defineConfig } from "eslint/config";
import js from "@eslint/js";

export default defineConfig([
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: {...globals.node} } },
  js.configs.recommended,
  {
    rules: {
      // Enforce consistent spacing
      "no-multi-spaces": "error",
      // Enforce consistent indentation
      "indent": ["error", 2],
      // Enforce semicolons
      "semi": ["error", "always"],
      // Enforce consistent quotes
      "quotes": ["error", "double"],
      // Enforce consistent comma style
      "comma-style": ["error", "last"],
      // Enforce consistent spacing before and after commas
      "comma-spacing": ["error", { "before": false, "after": true }],
      // Enforce consistent spacing before function parentheses
      "space-before-function-paren": ["error", "never"],
      // Enforce consistent spacing inside braces
      "object-curly-spacing": ["error", "always"],
      // Enforce consistent spacing before blocks
      "space-before-blocks": ["error", "always"],
      // Enforce consistent spacing around keywords
      "keyword-spacing": ["error", { "before": true, "after": true }]
    }
  }
]);
