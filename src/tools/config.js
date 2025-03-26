import { builtinModules } from "module";
import esbuild from 'esbuild';
import fs from "fs-extra";

import { externalsPlugin, log, pkg } from "./consts";
import path from "path";
import { fileInjector } from "../uni/inject";


const buildFactory = (c) => {
    const { minify, splitting, external, plugins, loader, jsx, format } = c;
    let context; //cache esbuild

    const inject = fileInjector("{{", "}}");

    return async (rebuildStatic = false, cleanUp = false) => {
        if (!context && fs.existsSync(c.srcdir)) {
            context = await esbuild.context({
                format,
                minify,
                color: true,
                bundle: true,
                sourcemap: true,
                logLevel: 'error',
                entryPoints: c.entries,
                outdir: c.distdir,
                define: { __sapp_info: JSON.stringify(c.info), __sapp_io_config: JSON.stringify(c.io) },
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

        if (rebuildStatic && cleanUp) { await fs.remove(c.distdir); }
        if (rebuildStatic && fs.existsSync(c.staticdir)) {
            await fs.copy(c.staticdir, c.distdir);
            await Promise.all(c.injects.map(f => inject(path.join(c.distdir, f), c.info)));
        }

        await context?.rebuild();
    }

}

export const parseConfig = (config = {}) => {
    const c = config || {};

    const guid = Array(16).fill().map(_ => Math.random().toString(36).slice(2)).join('');

    const { name, description, version, author } = pkg;
    const isBuild = c.isBuild = (c.isBuild ? true : false);

    const info = { ...(c.info ? c.info : {}), isBuild, name, description, version, author, guid };
    const rebuildBuffer = Math.max(0, Number(c.rebuildBuffer) || 100);
    const external = c.external || [];
    const plugins = c.plugins || [];
    const loader = c.loader || {};
    const jsx = c.jsx || {};

    const srcdir = c.srcdir || "src";
    const distdir = isBuild ? (c.distdir || "dist") : (c.demodir || "demo");
    const arcdir = path.join(srcdir, c.arcdir || "arc");

    if (c.injects) { log.red("Property 'config.injects' is deprecated please use 'config.fe.injects' or 'config.be.injects'") }

    const fe = c.fe || {};
    fe.dir = fe.dir || "frontend";
    fe.distdir = path.join(distdir, fe.dir);
    fe.static = fe.static || "public";
    fe.info = { ...(fe.info || {}), ...info };
    fe.format = "iife";
    fe.splitting = false;
    fe.injects = fe.injects || c.injects || ["index.html"];

    const be = c.be || {};
    be.dir = be.dir || "backend";
    be.distdir = path.join(distdir, be.dir);
    be.static = be.static || "private";
    be.info = { ...(be.info || {}), ...info, dir:{ root:path.relative(be.dir, '.'), fe:path.relative(be.dir, fe.dir) } };
    be.format = (be.format || "esm");
    be.splitting = (be.format === "esm");
    be.injects = be.injects || [];
    be.external = [...(be.external || []), ...builtinModules, "koa", "express", "socket.io", "chalk", "detect-port"];
    be.plugins = [...(be.plugins || []), externalsPlugin];
    
    

    for (const x of [fe, be]) {
        x.srcdir = path.join(srcdir, x.dir);
        x.staticdir = path.join(srcdir, x.static);
        x.entries = (x.entries || ["index.js"]).map(e => path.join(x.srcdir, e));
        x.minify = x.minify != null ? x.minify : isBuild;
        x.external = [...(x.external || []), ...external];
        x.plugins = [...(x.plugins || []), ...plugins];
        x.loader = { ...(x.loader || {}), ...loader };
        x.jsx = x.jsx ? { ...jsx, ...x.jsx } : jsx;
        x.io = x.io || {};
        x.rebuild = buildFactory(x);
    }

    return { isBuild, distdir, srcdir, arcdir, fe, be, rebuildBuffer, log }

}