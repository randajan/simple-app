import { builtinModules } from "module";
import { build } from 'esbuild';

import { env, externalsPlugin, log, pkg, root } from "./consts";
import { argv } from "./argv";
import { parseEnvs } from "./envs";
import { mergeObj } from "./uni";


const buildFactory = ({ entries, distdir, minify, splitting, external, plugins, loader, jsx, format, info, io }) => {
  let _build; //cache esbuild

  return async _ => {
    if (_build) { await _build.rebuild(); return _build; }
    return _build = await build({
      format,
      minify,
      color: true,
      bundle: true,
      sourcemap: true,
      logLevel: 'error',
      incremental: true,
      entryPoints: entries,
      outdir: distdir,
      define: { __sapp_info: JSON.stringify(info), __sapp_io_config:JSON.stringify(io) },
      splitting,
      external,
      plugins,
      loader,
      jsx:jsx.transform,
      jsxDev:jsx.dev,
      jsxFactory:jsx.factory,
      jsxFragment:jsx.fragment || jsx.factory,
      jsxImportSource:jsx.importSource
    });
  }

}

export const parseConfig = (isProd, config = {}) => {
  const envs = parseEnvs(isProd);
  const c = mergeObj(envs, config, argv);

  const guid = Array(16).fill().map(_=>Math.random().toString(36).slice(2)).join('');
  const port = c.port || 3000;

  const { name, description, version, author } = pkg;
  const info = { ...(c.info ? c.info : {}), isProd, env, name, description, version, author, guid };
  const home = info.home = new URL(info.home || `http://localhost:${port}`);
  home.toJSON = _ => Object.fromEntries(["host", "hostname", "origin", "pathname", "port", "protocol"].map(p => [p, home[p]]));
  const injects = c.injects || ["index.html"];
  const rebuildBuffer = Math.max(0, Number(c.rebuildBuffer) || 100);
  const external = c.external || [];
  const plugins = c.plugins || [];
  const loader = c.loader || {};
  const jsx = c.jsx || {};

  const srcdir = c.srcdir || "src";
  const distdir = c.distdir || "dist";

  const fe = c.fe || {};
  const be = c.be || {};

  fe.dir = fe.dir || "frontend";
  fe.distdir = distdir + "/" + fe.dir;
  fe.info = { ...(fe.info || {}), ...info };
  fe.format = "iife";
  fe.splitting = false;

  be.dir = be.dir || "backend";
  be.distdir = distdir + "/" + be.dir;
  be.info = { ...(be.info || {}), ...info, port, dir: { root, dist: distdir, fe: fe.distdir, be: be.distdir } };
  be.format = (be.format || "esm");
  be.splitting = (be.format === "esm");
  be.external = [...(be.external || []), ...builtinModules, "koa", "express", "socket.io", "chalk"];
  be.plugins = [...(be.plugins || []), externalsPlugin];

  for (const x of [fe, be]) {
    x.srcdir = srcdir + "/" + x.dir;
    x.entries = (x.entries || ["index.js"]).map(e => x.srcdir + "/" + e);
    x.minify = x.minify != null ? x.minify : isProd;
    x.external = [...(x.external || []), ...external];
    x.plugins = [...(x.plugins || []), ...plugins];
    x.loader = { ...(x.loader || {}), ...loader };
    x.jsx = x.jsx ? {...jsx, ...x.jsx} : jsx;
    x.io = x.io || {};
    x.rebuild = buildFactory(x);
  }

  return { port, srcdir, distdir, fe, be, injects, rebuildBuffer, log }

}