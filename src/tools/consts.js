
import { nodeExternalsPlugin } from "esbuild-node-externals";
import fse from "fs-extra";

import { mainLogger } from "./logger";
import path from "path";

export const pkg = fse.readJSONSync(path.join(process.cwd(), "package.json"));

export const externalsPlugin = nodeExternalsPlugin({
    // allowList: [
    //     "fe", "be", "be/server", "be/express", "be/koa",
    //     "info", "log", "env", "argv", "fs", "inject"
    // ].map(v => "@randajan/simple-app/" + v)
});

export const log = mainLogger(pkg.name, pkg.version);