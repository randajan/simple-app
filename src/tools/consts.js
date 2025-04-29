
import fse from "fs-extra";

import { mainLogger } from "./logger";
import path from "path";

export const pkg = fse.readJSONSync(path.join(process.cwd(), "package.json"));

export const log = mainLogger(pkg.name, pkg.version);

export const getPkgFormat = _=>{
    const { type } = pkg;
    if (type === "module") { return "esm"; }
    if (!type || type === "commonjs") { return "cjs"; }
    throw new Error(`Invalid package.json type property '${type}'`);
}

export const validateFormat = (format)=>{
    const pkgFormat = getPkgFormat();
    if (!format) { return pkgFormat; }
    if (pkgFormat !== format) {
        log.red(`Package type is set to '${pkg.type}' so be.format should be '${pkgFormat}' but '${format}' was provided.`);
    }
    return format;
}

export const reSlash = raw=>raw.replaceAll("\\", "/");

export const relPath = (from, to)=>reSlash(path.relative(from, to));