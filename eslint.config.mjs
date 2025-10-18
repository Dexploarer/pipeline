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
    rules: {
      // Strict TypeScript Rules
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_"
      }],
      "@typescript-eslint/explicit-function-return-type": ["warn", {
        "allowExpressions": true,
        "allowTypedFunctionExpressions": true,
        "allowHigherOrderFunctions": true
      }],
      "@typescript-eslint/explicit-module-boundary-types": "warn",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/strict-boolean-expressions": ["warn", {
        "allowString": false,
        "allowNumber": false,
        "allowNullableObject": false
      }],
      "@typescript-eslint/no-unnecessary-condition": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "error",
      "@typescript-eslint/prefer-optional-chain": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      // Ban specific types
      "@typescript-eslint/ban-types": ["error", {
        "types": {
          "Object": {
            "message": "Use object instead",
            "fixWith": "object"
          },
          "String": {
            "message": "Use string instead",
            "fixWith": "string"
          },
          "Boolean": {
            "message": "Use boolean instead",
            "fixWith": "boolean"
          },
          "Number": {
            "message": "Use number instead",
            "fixWith": "number"
          }
        },
        "extendDefaults": true
      }],
      // Import rules
      "no-restricted-imports": ["warn", {
        "patterns": [{
          "group": ["../*"],
          "message": "Use absolute imports with @ prefix instead"
        }]
      }]
    }
  }
];

export default eslintConfig;
