
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

export const mergeArr = (...arrs)=>{
    const r = [];
    for (const a of arrs) {
        if (Array.isArray(a)) { r.push(...a); }
    }
    return r;
}