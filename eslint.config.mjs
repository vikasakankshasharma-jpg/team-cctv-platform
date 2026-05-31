import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // Justification: Build/deployment scripts use CommonJS require()
      "@typescript-eslint/no-require-imports": "off",
      // Justification: Content-heavy UI with many safe apostrophes/quotes
      "react/no-unescaped-entities": "off",
      // Justification: Using standard img tags for external/unoptimized images
      "@next/next/no-img-element": "off",
      // Justification: Let developers decide const vs let
      "prefer-const": "off"
    }
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".firebase/**",
      "scratch/**",
      "functions/lib/**"
    ]
  }
];

export default eslintConfig;
