import { log, pkg } from "./consts";
import path from "path";
import { buildFactory } from "./buildFactory";
import { envFileName, parseEnvs } from "../uni/env";
import fse from "fs-extra";
import { mergeArr } from "./uni";
import { exBuiltin, exDeps, exPlugin } from "./externals";

export const parseConfig = (config = {}) => {
    const c = config || {};

    const guid = Array(16).fill().map(_ => Math.random().toString(36).slice(2)).join('');

    const { name, description, version, author } = pkg;
    const isBuild = c.isBuild = (c.isBuild ? true : false);

    const info = { ...(c.info ? c.info : {}), isBuild, name, description, version, author, guid };
    const rebuildBuffer = Math.max(0, Number(c.rebuildBuffer) || 100);
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
    fe.plugins = mergeArr(fe.plugins, c.plugins);
    delete fe.external;

    const be = c.be || {};
    be.dir = be.dir || "backend";
    be.distdir = path.join(distdir, be.dir);
    be.static = be.static || "private";
    be.info = { ...(be.info || {}), ...info, dir:{ root:path.relative(be.dir, '.'), be:".", fe:path.relative(be.dir, fe.dir) } };
    be.format = (be.format || "esm");
    be.splitting = (be.format === "esm");
    be.injects = be.injects || [];
    be.plugins = mergeArr(be.plugins, c.plugins);

    if (be.external) {
        be.external = mergeArr(be.external, exBuiltin);
    } else {
        be.plugins.unshift(exPlugin);
        be.external = mergeArr(exDeps, exBuiltin);
    }
    
    for (const x of [fe, be]) {
        x.srcdir = path.join(srcdir, x.dir);
        x.staticdir = path.join(srcdir, x.static);
        x.entries = (x.entries || ["index.js"]).map(e => path.join(x.srcdir, e));
        x.minify = x.minify != null ? x.minify : isBuild;
        x.loader = { ...(x.loader || {}), ...loader };
        x.jsx = x.jsx ? { ...jsx, ...x.jsx } : jsx;
        x.io = x.io || {};
        x.rebuild = buildFactory(x);
    }

    if (c.env) {
        const e = c.env;
        e.srcdir = path.join(srcdir, e.dir || "env");
        e.distdir = distdir;
        e.src = path.join(e.srcdir, envFileName(e.name));
        e.dist = path.join(e.distdir, ".env.json")

        let rebuild = be.rebuild;
        be.rebuild = async (rebuildStatic, cleanUp, rebuildEnv)=>{
            if (!rebuildEnv) { return rebuild(rebuildStatic, cleanUp); }
            const { sample:{ data, flat } } = parseEnvs(e.name, e.srcdir, true);
            if (!isBuild) { await fse.copyFile(e.src, e.dist); }
            rebuild = buildFactory(be, { data, flat });
            return rebuild(rebuildStatic, cleanUp);
        }
    }

    return { isBuild, distdir, srcdir, arcdir, fe, be, env:c.env, rebuildBuffer }

}