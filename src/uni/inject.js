import fse from "fs-extra";
import { flatObj } from "../tools/uni";

const _escapeRegExp = (str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

const _stringInject = (regex, string, vars) => {
    string = string == null ? "" : String(string);
    vars = flatObj(vars);
    return string.replace(regex, (_, key) => vars[key] != null ? vars[key] : ``);
};

export const stringInjector = (prefix, suffix) => {
    if (!prefix || !suffix || typeof prefix !== "string" || typeof suffix !== "string") {
        throw new Error("Prefix and suffix must be non-empty strings");
    }

    const pr = _escapeRegExp(prefix);
    const sr = _escapeRegExp(suffix);

    const regex = new RegExp(`${pr}(.*?)${sr}`, "g");

    return (string, vars = {}) => _stringInject(regex, string, vars);
};

export const fileInjector = (prefix, suffix)=>{
    const injector = stringInjector(prefix, suffix);
    return async (file, vars = {}) => fse.writeFile(file, injector(await fse.readFile(file), vars));
}
