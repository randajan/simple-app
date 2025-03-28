
import fse from "fs-extra";

import { mainLogger } from "./logger";
import path from "path";

export const pkg = fse.readJSONSync(path.join(process.cwd(), "package.json"));

export const log = mainLogger(pkg.name, pkg.version);