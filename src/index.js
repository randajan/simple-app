import { watch } from "chokidar";
import fs from "fs-extra";
import open from "open";

import { root } from "./tools/consts.js";
import { argv } from "./tools/argv.js";
import { fileInjector } from "./tools/uni.js";

import templates from "./tools/templates.js";
import { parseConfig } from "./tools/config.js";

import { importFiles } from "./tools/importFiles.js";
import { spawn } from "child_process";
import path from "path";
import { StdIO } from "@randajan/std-io";



export { root, argv, importFiles }

export default async (config = {}) => {
    const { isProd, srcdir, distdir, fe, be, injects, rebuildBuffer, log } = parseConfig(config);
    const logbold = log.bold;
    const logred = logbold.red;
    const logmain = log.inverse;

    const injectPublic = fileInjector("{{", "}}");

    const buildPublic = async removeDir => {
        if (removeDir) { await fs.remove(removeDir); }
        await fs.copy(srcdir + '/public', fe.distdir);
        await Promise.all(injects.map(file => injectPublic(fe.distdir + "/" + file, fe.info)));
    };

    if (!fs.existsSync(srcdir)) {
        await Promise.all([
            fs.outputFile(srcdir + '/public/index.html', templates.index),
            fs.outputFile(srcdir + "/arc/index.js", templates.arc),
            fs.outputFile(be.srcdir + "/index.js", templates.be),
            fs.outputFile(fe.srcdir + "/index.js", templates.fe),
            fs.outputFile(fe.srcdir + '/index.css', templates.css),
        ]);
    }

    await buildPublic(distdir);
    await be.rebuild();
    await fe.rebuild();

    const servers = new Map();
    const rebootBE = async _ => {
        await be.rebuild();
        be.current = spawn("node", [path.join("./", be.distdir, "/index.js")], { stdio: ["pipe", "pipe", "pipe"] });
        be.std = new StdIO({process:be.current});
        be.std.rx("log", console.log);
        be.std.rx("error", console.error);
        be.std.rx("http", ({serverId, port, autoOpen})=>{
            const knownPort = servers.get(serverId);
            if (knownPort === port) { return false; }
            servers.set(serverId, port);
            logmain(`Server id '${serverId}'`, `${knownPort ? "re" : ""}started at port '${port}'`);
            if (!isProd && autoOpen) { open(`http://localhost:${port}`); }
            return true;
        });
    }

    const rebootFE = async (rebuildPublic = false) => {
        if (rebuildPublic) { await buildPublic(fe.dist); }
        await fe.rebuild();
    }

    ["SIGTERM", "SIGINT", "SIGQUIT"].forEach(signal => {
        process.on(signal, _ => {
            be.current.once("exit", _ => process.exit(0));
            be.std.tx("cmd", {cmd:"stop"});
        });
    });

    logbold.inverse(`Initialized environment`);

    await rebootBE();

    if (isProd) { return; }

    const rebootOn = (before, source, customLog, path, exe, ignored) => {
        const reboot = async _ => {
            const msg = source + " change";
            const { std } = be;
            if (std && before) { std.tx("cmd", {cmd:"restart", source}); }
            try { await exe(); } catch (e) { logred(msg, "failed"); log(e.stack); return; };
            if (std && !before) { std.tx("cmd", {cmd:"restart", source}); }
            customLog(msg + "d");
        }

        let timer;
        watch(path, { ignoreInitial: true, ignored }).on('all', (...args) => {
            clearTimeout(timer);
            timer = setTimeout(reboot, rebuildBuffer);
        });
    }

    rebootOn(false, "Public", logbold.magenta, srcdir + '/public/**/*', _ => rebootFE(true));
    rebootOn(true, "Arc", logbold.cyan, srcdir + '/arc/**/*', _ => Promise.all([rebootBE(), rebootFE()]));
    rebootOn(false, "CSS", logbold.yellow, [fe.srcdir + '/**/*.css', fe.srcdir + '/**/*.scss'], _ => rebootFE());
    rebootOn(false, "FE", logbold.green, fe.srcdir + '/**/*', _ => rebootFE(), /(\.s?css)$/);
    rebootOn(true, "BE", logbold.blue, be.srcdir + '/**/*', _ => rebootBE());

}