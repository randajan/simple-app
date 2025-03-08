import fse from "fs-extra";

export const isObj = any => any != null && typeof any === "object" && !Array.isArray(any);
export const isObjEmpty = any => { for (let i in any) { return false; } return true; };


const escapeDots = str => str.replaceAll(".", "\\.");
const unescapeDots = str => str.replaceAll("\\.", ".");

const splitByRealDots = str => (str.match(/(?:\\.|[^.])+/g) || []);

export const flatObj = (obj, index = {}, prefix = "") => {
    for (let i in obj) {
        const f = obj[i];
        if (f === undefined) { continue; }
        const key = (prefix ? prefix + "." : "") + escapeDots(i);
        if (Array.isArray(f) && Array.isArray(index[key])) { index[key] = [...index[key], ...f]; } //merging array
        else if (isObj(f)) { flatObj(f, index, key); }
        else { index[key] = f; }
    }
    return index;
}

export const fillObj = (obj, path, value) => {
    if (!Array.isArray(path)) { path = splitByRealDots(path); }

    const key = unescapeDots(path.shift());
    const remove = value === undefined;

    if (!path.length) {
        if (remove) { delete obj[key]; } else { obj[key] = value; }
        return obj;
    }

    const io = isObj(obj[key]);
    if (!io) {
        if (remove) { return obj; } else { obj[key] = {}; }
    }

    fillObj(obj[key], path, value);

    if (remove && isObjEmpty(obj[key])) { delete obj[key]; }

    return obj;
}

export const mergeObj = (...objs) => {
    const flat = {}, result = {};
    for (const obj of objs) { flatObj(obj, flat); }
    for (const key in flat) { fillObj(result, key, flat[key]); }
    return result;
}


const _escapeRegExp = (str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

const _stringInject = (regex, string, vars) => {
    string = string == null ? "" : String(string);
    vars = flatObj(vars);
    return string.replace(regex, (_, key) => vars[key] != null ? vars[key] : ``);
};

const stringInjector = (prefix, suffix) => {
    if (!prefix || !suffix || typeof prefix !== "string" || typeof suffix !== "string") {
        throw new Error("Prefix and suffix must be non-empty strings");
    }

    const pr = _escapeRegExp(prefix);
    const sr = _escapeRegExp(suffix);

    // 📌 Bezpečnější regulární výraz bez lookbehind
    const regex = new RegExp(`${pr}(.*?)${sr}`, "g");

    return (string, vars = {}) => _stringInject(regex, string, vars);
};

export const fileInjector = (prefix, suffix)=>{
    const injector = stringInjector(prefix, suffix);
    return async (file, vars = {}) => fse.writeFile(file, injector(await fse.readFile(file), vars));
}

