import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"
import nextTs from "eslint-config-next/typescript"

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // React Compiler rules arrived with eslint-config-next 16: the existing
      // code predates them. Warn for now and fix them file by file.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/purity": "warn",
      // Apostrophes in Italian copy ("l'app") are fine as literal text.
      "react/no-unescaped-entities": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated or native shells: not our code to lint.
    "src/generated/**",
    "android/**",
    "ios/**",
    "public/**",
    ".claude/**",
  ]),
])

export default eslintConfig
