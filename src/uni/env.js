import path from "path";
import fse from "fs-extra";

import { fillObj, flatObj, mergeObj } from "../tools/uni";
import info from "../uni/info";

const getTemplate = any=>{
  if (any == null) { return any; }
  const t = typeof any;
  if (t == "object") { return Array.isArray(any) ? [] : {}; }
  return t;
}

const ensureJSONSync = (prefix, pathname, defaultContent={}, msgSuffix="")=>{
  if (fse.existsSync(pathname)) { return fse.readJSONSync(pathname); }

  console.log(`${prefix}Not found '${pathname}'`);
  fse.outputJSONSync(pathname, defaultContent, { spaces: 4 });
  console.log(`${prefix}Created '${pathname}' ${msgSuffix}`);

  return defaultContent;
}


export const parseEnvs = (name, ...mergeWith)=>{

  const root = info?.dir?.root || process.cwd();
  const prefix = `ENV:${name} - `;

  const tempPath = path.join(root,  `sample.env.json`);
  const envsPath = path.join(root, `.env.${name}.json`);
  const temp = ensureJSONSync(prefix, tempPath, {});
  const envs = ensureJSONSync(prefix, envsPath, temp, "from template");

  const tempFlat = flatObj(temp);
  const envsFlat = flatObj(envs);

  const tempMissing = Object.keys(envsFlat).filter(k=>!tempFlat.hasOwnProperty(k));
  const envsMissing = Object.keys(tempFlat).filter(k=>!envsFlat.hasOwnProperty(k));

  const result = mergeObj(envs, ...mergeWith);

  if (!tempMissing.length && !envsMissing.length) { return result; }

  if (info?.isBuild) {
    const mismatch = [...envsMissing.map(k=>"missing: "+k), ...tempMissing.map(k=>"unknown: "+k)];
    console.log(`${prefix}${envsPath} configuration mismatch\n  ${mismatch.join("\n  ")}`);
    throw new Error(`${prefix} configuration mismatch`);
  }

  const updates = [...tempMissing.map(k=>"add: "+k), ...envsMissing.map(k=>"removed: "+k)];
  for (const key of tempMissing) { fillObj(temp, key, getTemplate(envsFlat[key])); }
  for (const key of envsMissing) { fillObj(temp, key); }

  console.log(`${prefix}${tempPath} autoupdated \n  ${updates.join("\n  ")}`);

  fse.outputJSONSync(tempPath, temp, { spaces: 4 });

  return result;
}

export default parseEnvs;