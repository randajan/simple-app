import fse from "fs-extra";

export const isObj = any=>any != null && typeof any === "object" && !Array.isArray(any);
export const isObjEmpty = any=>{ for (let i in any) { return false; } return true; }

export const flatObj = (obj, index={}, prefix="")=>{
  for (let i in obj) {
    const f = obj[i];
    if (f === undefined) { continue; }
    const key = (prefix ? prefix+"." : "")+i;
    if (Array.isArray(f) && Array.isArray(index[key])) { index[key] = [...index[key], ...f]; } //merging array
    else if (isObj(f)) { flatObj(f, index, key); }
    else { index[key] = f; }
  }
  return index;
}

export const fillObj = (obj, path, value)=>{
  const key = path.shift();
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

export const mergeObj = (...objs)=>{
  const flat = {}, result = {};
  for (const obj of objs) { flatObj(obj, flat); }
  for (const key in flat) { fillObj(result, key.split("."), flat[key]); }
  return result;
}

export const injectString = (string, vars={})=>{
    string = string == null ? "" : String(string);
    vars = flatObj(vars);
    for (let key of (new Set(string.match(/(?<=\{\{)[^\{\}]+(?=\}\})/g)))) {
      string = string.replaceAll("{{"+key+"}}", vars[key] == null ? "" : vars[key]);
    }
    return string;
  }


export const injectFile = async (file, vars={})=>await fse.writeFile(file, injectString(await fse.readFile(file), vars));