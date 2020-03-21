import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import htmlTemplate from "rollup-plugin-generate-html-template";
import { terser } from "rollup-plugin-terser";
import resolve from "@rollup/plugin-node-resolve";

const isProduction = process.env.NODE_ENV === "production";

export default [
  {
    input: "./src/client/index.ts",
    output: {
      name: "caldera-client",
      file: "dist/public/caldera-client.js",
      format: "umd"
    },
    plugins: [
      typescript({
        module: "esnext"
      }),
      commonjs(),
      resolve(),
      isProduction && terser(),
      htmlTemplate({
        template: "src/client/index.html",
        target: "index.html"
      })
    ]
  }
];
