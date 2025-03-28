
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { mergeArr } from "./uni";
import { builtinModules } from "module";

export const exSelfs = [
    "fe", "be", "be/server", "be/express", "be/koa",
    "info", "log", "env", "argv", "fs", "inject"
].map(v => "@randajan/simple-app/" + v);

//allowList must be here so info could work
export const exPlugin = nodeExternalsPlugin({ allowList: exSelfs});

export const exDeps = ["chalk", "detect-port", "fs-extra", "socket.io", "socket.io-client"];
export const exBuiltin = mergeArr(builtinModules, builtinModules.map(m => `node:${m}`));