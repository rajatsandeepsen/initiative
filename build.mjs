import dts from "bun-plugin-dts";

await Bun.build({
  noBanner: true,
  entrypoints: ["./index.ts"],
  outdir: "./dist",
  minify: true,
  external: [
    "ai",
    "zod",
    "zod-to-ts"
  ],
  plugins: [dts()],
});
