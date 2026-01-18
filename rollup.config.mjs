import svelte from "rollup-plugin-svelte";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { sveltePreprocess } from "svelte-preprocess";
import { env } from "process";
import postcss from "rollup-plugin-postcss";

export default {
  input: "src/main.ts",
  output: [
    {
      format: "cjs",
      file: "main.js",
      exports: "default",
    },
  ],
  external: ["obsidian", "fs", "os", "path"],
  plugins: [
    svelte({
      preprocess: sveltePreprocess(),
    }),
    postcss({
      extract: "styles.css",
    }),
    typescript({ sourceMap: env.env === "DEV" }),
    resolve({
      browser: true,
      dedupe: ["svelte"],
    }),
    commonjs({
      include: "node_modules/**",
    }),
  ],
};
