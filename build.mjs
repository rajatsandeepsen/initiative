import dts from "bun-plugin-dts";

await Bun.build({
  entrypoints: ["./index.ts"],
  outdir: "./dist",
  minify: true,
  external: [
    "zod",
    "zod-to-ts",
    "@langchain/community",
    "@langchain/core",
    "langchain",
    "zod-validation-error",
  ],
  plugins: [dts()],
});
