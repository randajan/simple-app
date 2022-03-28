import { watch } from "chokidar";
import { build } from 'esbuild';
import open from "open";
import fs from "fs-extra";
import { builtinModules } from "module";
import approot from "app-root-path";
import { nodeExternalsPlugin } from "esbuild-node-externals";

import templates from "./templates.js";

import npath from 'path';
import nurl from 'url';

const { NODE_ENV, npm_package_version, npm_package_name, npm_package_author_name } = process.env;

const root = approot.path;
const name = npm_package_name;
const version = npm_package_version;
const author = npm_package_author_name;
const env = NODE_ENV;

const getDir = meta=>npath.dirname(nurl.fileURLToPath(meta.url));
const rootImport = (meta, path)=>import(npath.relative(getDir(meta), root+"/"+path).replace("\\", "/"));

const log = (color, ...msgs)=>console.log(
    color,
    [
        (env ? [name, version, env] : [name, version]).join(" "),
        (new Date()).toLocaleTimeString("cs-CZ"),
        msgs.join(" "),
    ].join(" | "),
    "\x1b[0m"
);

const ensureFile = async (path, template)=>{
  if (fs.existsSync(path)) { return; }
  await fs.outputFile(path, template);
}

export default async (options={})=>{
  let {
    dev,
    port,
    home,
    srcdir,
    distdir,
    define,
    fe,
    be
  } = options;

  dev = dev || false;
  port = port || 3000;
  home = new URL(home || `http://localhost:${port}`);
  home.toJSON = _=>Object.fromEntries(["host", "hostname", "origin", "pathname", "port", "protocol"].map(p=>[p, home[p]]));
  define = (define || {});
  srcdir = srcdir || "src";
  distdir = distdir || "dist";

  fe = fe || {};
  be = be || {};
  fe.dir = fe.dir || "frontend";
  be.dir = be.dir || "backend";
  
  for (const xe of [fe, be]) {
    xe.define = xe.define || {};
    xe.plugins = xe.plugins || [];
    xe.src = srcdir+"/"+xe.dir;
    xe.dist = distdir+"/"+xe.dir;
    xe.entry = xe.src+"/"+(xe.entry || "index.js");
  }

  const buildPublic = async removeDir=>{
    if (removeDir) { await fs.remove(removeDir); }
    await fs.copy(srcdir+'/public', fe.dist);
  };

  const tmp = templates();
  await ensureFile(srcdir+'/public/index.html', tmp.index);
  await ensureFile(srcdir+"/arc/index.js", tmp.arc);
  await ensureFile(be.entry, tmp.be);
  await ensureFile(fe.entry, tmp.fe);

  await buildPublic(distdir);

  const uni = {
    color:true,
    minify: !dev,
    bundle: true,
    sourcemap: true,
    logLevel: 'error',
    incremental: true
  }

  const [bed, fed] = await Promise.all([
    build({
      entryPoints: [be.entry],
      outdir: be.dist,
      splitting: true,
      plugins:[...be.plugins, nodeExternalsPlugin({ allowList:["@randajan/simple-app/backend"]})],
      external:[...builtinModules, "express", "socket.io"],
      format:'esm',
      define:{__sapp:JSON.stringify({ ...define, ...be.define, dev, name, version, author, env, home, port, dir:{ root, dist:distdir, fe:fe.dist, be:be.dist }})},
      ...uni
    }),
    build({
      entryPoints: [fe.entry],
      outdir: fe.dist,
      format:"iife",
      plugins:fe.plugins,
      define:{__sapp:JSON.stringify({ ...define, ...fe.define, dev, name, version, author, env, home })},
      ...uni
    })
  ]);

  const rebootBE = async _=>{
    if (bed.current) {
      await bed.rebuild();
      bed.current.http.close();
    }
    bed.current = (await rootImport(import.meta, be.dist+"/index.js?update="+Date.now())).default;
  }
  const rebootFE = async (hard)=>{
    if (hard) { await buildPublic(fe.dist); }
    await fed.rebuild();
  }

  await rebootBE();

  log("\x1b[1m\x1b[33m", `Started at ${home.origin}`);

  if (!dev) { return; }

  const rebootOn = (path, exe, color, msg)=>{
    watch(path, { ignoreInitial:true }).on('all', async _=>{
      const before = bed.current;
      try { await exe(); } catch(e) { log("\x1b[1m\x1b[31m", msg, "failed"); console.log(e.stack); return; };
      before.io.emit("reboot", msg+"d"); 
      before.http.clients.forEach(c=>c.destroy());
      log(color, msg+"d");
    });
  }

  rebootOn(fe.src+'/**/*', _=>rebootFE(), "\x1b[1m\x1b[32m", "FE change");
  rebootOn(srcdir+'/public/**/*', _=>rebootFE(true), "\x1b[1m\x1b[35m", "Public change");
  rebootOn(srcdir+'/arc/**/*', _=>Promise.all([ rebootBE(), rebootFE()]), "\x1b[1m\x1b[36m", "Arc change");
  rebootOn(be.src+'/**/*', _=>rebootBE(), "\x1b[1m\x1b[34m", "BE change");

  open(`${home.origin}`);

}