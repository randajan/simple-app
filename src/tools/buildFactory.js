import esbuild from 'esbuild';
import fs from "fs-extra";

import path from "path";
import { fileInjector } from "../uni/inject";

const inject = fileInjector("{{", "}}");

export const buildFactory = (c, env) => {
    const { minify, splitting, external, plugins, loader, jsx, format, info, io } = c;
    let context; //cache esbuild

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
                define: { __sappEsbuildDefs:JSON.stringify({info, io, env}) },
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