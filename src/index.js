import { Worker } from "worker_threads";
import { watch } from "chokidar";
import { build } from 'esbuild';
import open from "open";
import fs from "fs-extra";
import { builtinModules } from "module";
import approot from "app-root-path";
import { nodeExternalsPlugin } from "esbuild-node-externals";

import { injectString, injectFile } from "./inject.js";

import templates from "./templates.js";

const { NODE_ENV, npm_package_version, npm_package_name, npm_package_author_name } = process.env;

const root = approot.path;
const name = npm_package_name;
const version = npm_package_version;
const author = npm_package_author_name;
const env = NODE_ENV;

export const log = (color, ...msgs)=>console.log(
    color,
    [
        (env ? [name, version, env] : [name, version]).join(" "),
        (new Date()).toLocaleTimeString("cs-CZ"),
        msgs.join(" "),
    ].join(" | "),
    "\x1b[0m"
);

export default async (isProd=false, o={})=>{
  const port = o.port || 3000;
  const info = {...(o.info ? o.info : {}), isProd, name, version, author, env};
  const home = info.home = new URL(info.home || `http://localhost:${port}`);
  home.toJSON = _=>Object.fromEntries(["host", "hostname", "origin", "pathname", "port", "protocol"].map(p=>[p, home[p]]));
  const srcdir = o.srcdir || "src";
  const distdir = o.distdir || "dist";
  const injects = o.injects || ["index.html"];

  const fe = o.fe || {};
  const be = o.be || {};
  fe.dir = fe.dir || "frontend";
  be.dir = be.dir || "backend";
  
  for (const xe of [fe, be]) {
    xe.info = xe.info || {};
    xe.plugins = xe.plugins || [];
    xe.loader = xe.loader || {};
    xe.src = srcdir+"/"+xe.dir;
    xe.dist = distdir+"/"+xe.dir;
    xe.entries = (xe.entries || ["index.js"]).map(e=>xe.src+"/"+e);
  }

  const buildPublic = async removeDir=>{
    if (removeDir) { await fs.remove(removeDir); }
    await fs.copy(srcdir+'/public', fe.dist);
    await Promise.all(injects.map(file=>injectFile(fe.dist+"/"+file, info)));
  };

  if (!fs.existsSync(srcdir)) {
    const tmp = templates();
    await Promise.all([
      fs.outputFile(srcdir+'/public/index.html', tmp.index),
      fs.outputFile(srcdir+"/arc/index.js", tmp.arc),
      fs.outputFile(be.src+"/index.js", tmp.be),
      fs.outputFile(fe.src+"/index.js", tmp.fe),
    ]);
  }

  await buildPublic(distdir);

  const uni = {
    color:true,
    minify: isProd,
    bundle: true,
    sourcemap: true,
    logLevel: 'error',
    incremental: true
  }

  const [bed, fed] = await Promise.all([
    build({
      entryPoints: be.entries,
      outdir: be.dist,
      splitting: true,
      plugins:[...be.plugins, nodeExternalsPlugin({ allowList:["@randajan/simple-app/info", "@randajan/simple-app/be"]})],
      external:[...builtinModules, "express", "socket.io"],
      format:'esm',
      define:{__sapp_info:JSON.stringify({ ...be.info, ...info, port, dir:{ root, dist:distdir, fe:fe.dist, be:be.dist }})},
      loader:be.loader,
      ...uni
    }),
    build({
      entryPoints: fe.entries,
      outdir: fe.dist,
      format:"iife",
      plugins:fe.plugins,
      external:builtinModules,
      define:{__sapp_info:JSON.stringify({ ...fe.info, ...info })},
      loader:fe.loader,
      ...uni
    })
  ]);

  const rebootBE = async _=>{
    if (be.current) {
      await bed.rebuild();
      be.current.postMessage("stop");
    }
    be.current = new Worker((root+"/"+be.dist+"/index.js").replaceAll("\\", "/"));
  }
  const rebootFE = async (hard)=>{
    if (hard) { await buildPublic(fe.dist); }
    await fed.rebuild();
  }

  await rebootBE();

  process.on('SIGINT', _=>{
    be.current.on("exit", _=>process.exit(0));
    be.current.postMessage("shutdown");
  });

  log("\x1b[1m\x1b[33m", `Started at ${home.origin}`);

  if (isProd) { return; }

  const rebootOn = (path, exe, color, msg)=>{
    watch(path, { ignoreInitial:true }).on('all', async _=>{
      const before = be.current;
      try { await exe(); } catch(e) { log("\x1b[1m\x1b[31m", msg, "failed"); console.log(e.stack); return; };
      before.postMessage("refresh");
      log(color, msg+"d");
    });
  }

  rebootOn(srcdir+'/public/**/*', _=>rebootFE(true), "\x1b[1m\x1b[35m", "Public change");
  rebootOn(srcdir+'/arc/**/*', _=>Promise.all([ rebootBE(), rebootFE()]), "\x1b[1m\x1b[36m", "Arc change");
  rebootOn(fe.src+'/**/*', _=>rebootFE(), "\x1b[1m\x1b[32m", "FE change");
  rebootOn(be.src+'/**/*', _=>rebootBE(), "\x1b[1m\x1b[34m", "BE change");

  open(home.origin);

}