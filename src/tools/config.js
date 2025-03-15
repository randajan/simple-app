import { builtinModules } from "module";
import esbuild from 'esbuild';

import { env, externalsPlugin, log, pkg, root } from "./consts";
import { parseEnvs } from "./envs";


const buildFactory = ({ entries, distdir, minify, splitting, external, plugins, loader, jsx, format, info, io }) => {
    let context; //cache esbuild

    return async _ => {
        if (!context) {
            context = await esbuild.context({
                format,
                minify,
                color: true,
                bundle: true,
                sourcemap: true,
                logLevel: 'error',
                entryPoints: entries,
                outdir: distdir,
                define: { __sapp_info: JSON.stringify(info), __sapp_io_config: JSON.stringify(io) },
                splitting,
                external,
                plugins,
                loader,
                jsx: jsx.transform,
                jsxDev: jsx.dev,
                jsxFactory: jsx.factory,
                jsxFragment: jsx.fragment || jsx.factory,
                jsxImportSource: jsx.importSource
            });
        }

        await context.rebuild();
        return context;
    }

}

export const parseConfig = (config = {}) => {
    const c = parseEnvs(config);

    const guid = Array(16).fill().map(_ => Math.random().toString(36).slice(2)).join('');

    const { name, description, version, author } = pkg;
    const isProd = c.isProd = (c.isProd ? true : false);
    const ports = Array.isArray(c.port) ? c.port : [c.port || 3000];

    const info = { ...(c.info ? c.info : {}), isProd, env, name, description, version, author, guid };
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
    be.info = { ...(be.info || {}), ...info, ports, dir: { root, dist: distdir, fe: fe.distdir, be: be.distdir } };
    be.format = (be.format || "esm");
    be.splitting = (be.format === "esm");
    be.external = [...(be.external || []), ...builtinModules, "koa", "express", "socket.io", "chalk", "detect-port"];
    be.plugins = [...(be.plugins || []), externalsPlugin];

    for (const x of [fe, be]) {
        x.srcdir = srcdir + "/" + x.dir;
        x.entries = (x.entries || ["index.js"]).map(e => x.srcdir + "/" + e);
        x.minify = x.minify != null ? x.minify : isProd;
        x.external = [...(x.external || []), ...external];
        x.plugins = [...(x.plugins || []), ...plugins];
        x.loader = { ...(x.loader || {}), ...loader };
        x.jsx = x.jsx ? { ...jsx, ...x.jsx } : jsx;
        x.io = x.io || {};
        x.rebuild = buildFactory(x);
    }

    return { isProd, srcdir, distdir, fe, be, injects, rebuildBuffer, log }

}