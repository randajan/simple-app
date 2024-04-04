import { builtinModules } from "module";
import { build } from 'esbuild';
import approot from "app-root-path";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import fse from "fs-extra";

import argv from "./argv";
import { logger } from "./logger";

export const env = argv.env || process?.env?.NODE_ENV || "dev";
export const root = approot.path;

const { name, description, version, author } = fse.readJSONSync(root + "/package.json");

const _externalsPlugin = nodeExternalsPlugin({ allowList: ["info", "fe", "be", "be/express", "be/koa"].map(v => "@randajan/simple-app/" + v) });

let _envs;
export const envs = _ => {
  if (_envs) { return _envs; }
  const fileName = `.env.${env}.json`;
  const filePath = root + `/` + fileName;
  if (!fse.existsSync(filePath)) {
    const tempName = "template.env.json";
    const tempPath = root + `/` + tempName;
    if (!fse.existsSync(tempPath)) {
      fse.outputJSONSync(tempPath, { foo:"bar" }, { spaces: '\t' });
      console.warn(`Not found '${tempName}' - created`);
    }
    fse.copyFileSync(tempPath, filePath);
    console.warn(`Not found '${fileName}' - created from template`);
  }
  return _envs = fse.readJSONSync(filePath);
}

const buildFactory = ({ entries, distdir, minify, splitting, external, plugins, loader, jsx, format, info }) => {
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
      define: { __sapp_info: JSON.stringify(info) },
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

export const parseConfig = (isProd, c = {}) => {
  const port = c.port || argv.port || 3000;
  const info = { ...(c.info ? c.info : {}), isProd, env, name, description, version, author };
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
  fe.splitting = false;
  fe.format = "iife";

  be.dir = be.dir || "backend";
  be.distdir = distdir + "/" + be.dir;
  be.info = { ...(be.info || {}), ...info, port, dir: { root, dist: distdir, fe: fe.distdir, be: be.distdir } };
  be.splitting = true;
  be.format = "esm";
  be.external = [...(be.external || []), ...builtinModules, "koa", "express", "socket.io", "chalk"];
  be.plugins = [...(be.plugins || []), _externalsPlugin];

  for (const x of [fe, be]) {
    x.srcdir = srcdir + "/" + x.dir;
    x.entries = (x.entries || ["index.js"]).map(e => x.srcdir + "/" + e);
    x.minify = x.minify != null ? x.minify : isProd;
    x.external = [...(x.external || []), ...external];
    x.plugins = [...(x.plugins || []), ...plugins];
    x.loader = { ...(x.loader || {}), ...loader };
    x.jsx = x.jsx ? {...jsx, ...x.jsx} : jsx;
    x.rebuild = buildFactory(x);
  }

  return { port, srcdir, distdir, fe, be, injects, rebuildBuffer, log: logger(name, version, env) }

}