import approot from "app-root-path";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import fse from "fs-extra";

import { argv } from "./argv";
import { logger } from "./logger";

export const root = approot.path;
export const env = argv.env || process?.env?.NODE_ENV || "dev";

export const pkg = fse.readJSONSync(root + "/package.json");

export const externalsPlugin = nodeExternalsPlugin({ allowList: ["info", "fe", "be", "be/express", "be/koa"].map(v => "@randajan/simple-app/" + v) });

export const log = logger(pkg.name, pkg.version, pkg.env);