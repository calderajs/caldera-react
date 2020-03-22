import typescript from "rollup-plugin-typescript2";
import replace from "@rollup/plugin-replace";
import commonjs from "@rollup/plugin-commonjs";
import htmlTemplate from "rollup-plugin-generate-html-template";
import { terser } from "rollup-plugin-terser";
import resolve from "@rollup/plugin-node-resolve";

const { NODE_ENV } = process.env;
const isProduction = NODE_ENV === "production";

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
        tsconfigOverride: { compilerOptions: { module: "ESNext" } }
      }),
      commonjs(),
      resolve(),
      replace({ "process.env.NODE_ENV": JSON.stringify(NODE_ENV) }),
      isProduction && terser(),
      htmlTemplate({
        template: "src/client/index.html",
        target: "index.html"
      })
    ]
  }
];
