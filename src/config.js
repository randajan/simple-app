import { builtinModules } from "module";
import { build } from 'esbuild';
import approot from "app-root-path";
import { logger } from "./logger";
import { nodeExternalsPlugin } from "esbuild-node-externals";

const { NODE_ENV, npm_package_version, npm_package_name, npm_package_author_name, npm_package_description } = process.env;

export const argv = {};
for ( const arg of process.argv ) {
  const pair = String(arg).split("=");
  if (pair.length === 2) { Object.defineProperty(argv, pair[0], {value:pair[1], enumerable:true}); }
}

const root = approot.path;
const name = npm_package_name;
const description = npm_package_description;
const version = npm_package_version;
const author = npm_package_author_name;
const env = argv.env || NODE_ENV;

const _externalsPlugin = nodeExternalsPlugin({ allowList:["info", "fe", "express", "koa"].map(v=>"@randajan/simple-app/"+v)});

const buildFactory = ({entries, distdir, minify, splitting, external, plugins, loader, format, info})=>{
    let _build; //cache esbuild

    return async _=>{
        if (_build) { await _build.rebuild(); return _build; }
        return _build = await build({
            format,
            minify,
            color:true,
            bundle: true,
            sourcemap: true,
            logLevel: 'error',
            incremental: true,
            entryPoints:entries,
            outdir:distdir,
            define:{__sapp_info:JSON.stringify(info)},
            splitting,
            external,
            plugins,
            loader
        });
    }

}

export const parseConfig = (isProd, c={})=>{
  const port = c.port || argv.port || 3000;
  const info = {...(c.info ? c.info : {}), isProd, name, description, version, author, env};
  const home = info.home = new URL(info.home || `http://localhost:${port}`);
  home.toJSON = _=>Object.fromEntries(["host", "hostname", "origin", "pathname", "port", "protocol"].map(p=>[p, home[p]]));
  const injects = c.injects || ["index.html"];
  const rebuildBuffer = Math.max(0, Number(c.rebuildBuffer) || 100);
  const external = c.external || [];
  const plugins = c.plugins || [];
  const loader = c.loader || {};

  const srcdir = c.srcdir || "src";
  const distdir = c.distdir || "dist";

  const fe = c.fe || {};
  const be = c.be || {};

  fe.dir = fe.dir || "frontend";
  fe.distdir = distdir+"/"+fe.dir;
  fe.info = { ...(fe.info || {}), ...info };
  fe.splitting = false;
  fe.format = "iife";

  be.dir = be.dir || "backend";
  be.distdir = distdir+"/"+be.dir;
  be.info = { ...(be.info || {}), ...argv, ...info, port, dir:{ root, dist:distdir, fe:fe.distdir, be:be.distdir }};
  be.splitting = true;
  be.format = "esm";
  be.external = [...(be.external || []), ...builtinModules, "koa", "express", "socket.io"];
  be.plugins = [...(be.plugins || []), _externalsPlugin];

  for (const x of [fe, be]) {
    x.srcdir = srcdir+"/"+x.dir;
    x.entries = (x.entries || ["index.js"]).map(e=>x.srcdir+"/"+e);
    x.minify = x.minify != null ? x.minify : isProd;
    x.external = [...(x.external || []), ...external];
    x.plugins = [...(x.plugins || []), ...plugins];
    x.loader = {...(x.loader || {}), ...loader};
    x.rebuild = buildFactory(x);
  }

  return { port, srcdir, distdir, fe, be, injects, rebuildBuffer, log:logger(name, version, env) }

}