import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([".next/**", ".deploy/**", ".deploy_*/**", "node_modules/**", "next-env.d.ts"]),
]);
