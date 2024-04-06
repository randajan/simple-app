import path from "path";
import fse from "fs-extra";

import { env, log, root } from "./consts";
import { fillObj, flatObj } from "./uni";

const getTemplate = any=>{
  if (any == null) { return any; }
  const t = typeof any;
  if (t == "object") { return Array.isArray(any) ? [] : {}; }
  return t;
}


const ensureJSONSync = (pathname, defaultContent={}, msgSuffix="")=>{
  if (fse.existsSync(pathname)) { return fse.readJSONSync(pathname); }

  log.red(`Not found '${pathname}' - creating ${msgSuffix}`);

  fse.outputJSONSync(pathname, defaultContent, { spaces: 4 });
  log.yellow(`Created '${pathname}' ${msgSuffix}`);

  return defaultContent;
}

export const parseEnvs = (isProd)=>{
  
  const tempPath = path.normalize(`${root}/template.env.json`);
  const envsPath = path.normalize(`${root}/.env.${env}.json`);
  const temp = ensureJSONSync(tempPath);
  const envs = ensureJSONSync(envsPath, temp, "from template");

  const tempFlat = flatObj(temp);
  const envsFlat = flatObj(envs);

  const tempMissing = Object.keys(envsFlat).filter(k=>!tempFlat.hasOwnProperty(k));
  const envsMissing = Object.keys(tempFlat).filter(k=>!envsFlat.hasOwnProperty(k));

  if (!tempMissing.length && !envsMissing.length) { return envs; }

  if (isProd) {
    const mismatch = [...envsMissing.map(k=>"missing: "+k), ...tempMissing.map(k=>"unknown: "+k)];
    log.red(`${envsPath} configuration mismatch:\n  ${mismatch.join("\n  ")}`);
    throw new Error("Env configuration mismatch");
  }

  const updates = [...tempMissing.map(k=>"add: "+k), ...envsMissing.map(k=>"removed: "+k)];
  for (const key of tempMissing) { fillObj(temp, key.split("."), getTemplate(envsFlat[key])); }
  for (const key of envsMissing) { fillObj(temp, key.split(".")); }

  log.yellow(`${tempPath} auto updated:\n  ${updates.join("\n  ")}`);

  fse.outputJSONSync(tempPath, temp, { spaces: 4 });

  return envs;
}