
import { nodeExternalsPlugin } from "esbuild-node-externals";
import fse from "fs-extra";

import { argv } from "./argv";
import { mainLogger } from "./logger";

export const root = process.cwd();
export const env = argv.env || process?.env?.NODE_ENV || "dev";

export const pkg = fse.readJSONSync(root + "/package.json");

export const externalsPlugin = nodeExternalsPlugin({ allowList: ["info", "fe", "be", "be/express", "be/koa"].map(v => "@randajan/simple-app/" + v) });

export const log = mainLogger(pkg.name, pkg.version, env);