import path from "path";
import fse from "fs-extra";

import { fillObj, flatObj, mergeObj } from "../tools/uni";
import defs from "./_defs";
import info from "./info";
import argv from "./argv";

const getTemplate = any=>{
  if (any == null) { return any; }
  const t = typeof any;
  if (t == "object") { return Array.isArray(any) ? [] : {}; }
  return t;
}

const ensureJSONSync = (pathname, defaultContent={}, createMsg="")=>{
  if (fse.existsSync(pathname)) { return fse.readJSONSync(pathname); }

  console.log(`Env not found '${pathname}' - creating ${createMsg}`);
  fse.outputJSONSync(pathname, defaultContent, { spaces: 4 });

  return defaultContent;
}

export const envFileName = (name)=>`.env${(name ? "." : "") + name}.json`;
const getMissKeys = (check, against)=>Object.keys(against).filter(k=>!check.hasOwnProperty(k));


/*
  if (info?.isBuild) {

  }
*/

const parseEnv = (dir, filename, defaultContent={}, createMsg="", mergeWith)=>{
  const pathname = path.join(dir || process.cwd(), filename);
  const raw = ensureJSONSync(pathname, defaultContent, createMsg);
  const data = mergeWith ? mergeObj(raw, mergeWith) : raw;
  const flat = flatObj(data);
  return {pathname, data, flat};
}


export const parseEnvs = (name, dir, verbose=false)=>{

  const s = parseEnv(dir, `sample.env.json`, {});
  const e = parseEnv(dir, envFileName(name), s.data, "from sample");

  s.miss = getMissKeys(s.flat, e.flat);
  e.miss = getMissKeys(e.flat, s.flat);

  if (s.miss.length || e.miss.length) {
    const updates = [...s.miss.map(k=>"add: "+k), ...e.miss.map(k=>"removed: "+k)];
    for (const key of s.miss) { fillObj(s.data, key, getTemplate(e.flat[key])); }
    for (const key of e.miss) { fillObj(s.data, key); }

    console.log(`Env sample autoupdate \n  ${updates.join("\n  ")}`);
    fse.outputJSONSync(s.pathname, s.data, { spaces: 4 });
  }

  return verbose ? { sample:s, env:e } : e.data;
}

let env;

if (info?.dir && defs?.env) {
  const s = defs.env;
  const e = parseEnv(info.dir.root, ".env.json", s.data, "from sample", argv);
  
  if (info.isBuild) {
    s.miss = getMissKeys(s.flat, e.flat);
    e.miss = getMissKeys(e.flat, s.flat);
  
    if (s.miss.length || e.miss.length) {
      const mismatch = [...e.miss.map(k=>"missing: "+k), ...s.miss.map(k=>"unknown: "+k)];
      console.error(`Env configuration mismatch\n  ${mismatch.join("\n  ")}`);
      process.exit(0);
    }
  }

  env = e.data;
}

export default env;