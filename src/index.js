import { watch } from "chokidar";
import fs from "fs-extra";
import open from "open";

import { root } from "./tools/consts.js";
import { argv } from "./tools/argv.js";

import templates from "./tools/templates.js";
import { parseConfig } from "./tools/config.js";

import { importFiles } from "./tools/importFiles.js";
import { spawn } from "child_process";
import path from "path";
import { StdIO } from "@randajan/std-io";



export { root, argv, importFiles }

export default async (config = {}) => {
    const { isProd, srcdir, arcdir, fe, be, rebuildBuffer, log } = parseConfig(config);
    const logbold = log.bold;
    const logred = logbold.red;
    const logmain = log.inverse;

    if (!fs.existsSync(srcdir)) {
        await Promise.all([
            fs.outputFile(path.join(fe.staticdir, 'index.html'), templates.index),
            fs.outputFile(path.join(arcdir, "index.js"), templates.arc),
            fs.outputFile(path.join(be.srcdir, "index.js"), templates.be),
            fs.outputFile(path.join(fe.srcdir, "index.js"), templates.fe),
            fs.outputFile(path.join(fe.srcdir, 'index.css'), templates.css),
        ]);
    }

    const servers = new Map();
    const beRebuild = async (rebuildStatic=false, cleanUp=false)=> {
        await be.rebuild(rebuildStatic, cleanUp);
        be.current = spawn("node", [path.join("./", be.distdir, "/index.js")], { stdio: ["pipe", "pipe", "pipe"] });
        be.std = new StdIO({process:be.current});
        be.std.rx("log", console.log);
        be.std.rx("error", console.error);
        be.std.rx("http", ({id:serverId, port, autoOpen})=>{
            const knownPort = servers.get(serverId);
            if (knownPort === port) { return false; }
            servers.set(serverId, port);
            logmain(`Server id '${serverId}'`, `${knownPort ? "re" : ""}started at port '${port}'`);
            if (!isProd && autoOpen) { open(`http://localhost:${port}`); }
            return true;
        });
    }

    ["SIGTERM", "SIGINT", "SIGQUIT"].forEach(signal => {
        process.on(signal, _ => {
            be.current.once("exit", _ => process.exit(0));
            be.std.tx("cmd", {cmd:"stop"});
        });
    });

    logbold.inverse(`Initialized environment`);

    await Promise.all([ beRebuild(true, true), fe.rebuild(true, true) ]);

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

    const g = path.join("**", "*");
    const feg = path.join(fe.srcdir, g);

    if (fs.existsSync(be.srcdir)) {
        rebootOn(true, "BE", logbold.blue, path.join(be.srcdir, g), _ => beRebuild());
    }

    if (fs.existsSync(be.staticdir)) {
        rebootOn(true, `BE:${be.static}`, logbold.magenta, path.join(srcdir, be.static, g), _ => beRebuild(true));
    }
    
    if (fs.existsSync(arcdir)) {
        rebootOn(true, "Arc", logbold.cyan, path.join(arcdir, g), _ => Promise.all([beRebuild(), fe.rebuild()]));
    }

    if (fs.existsSync(fe.srcdir)) {
        rebootOn(false, "FE", logbold.green, feg, _ => fe.rebuild(), /(\.s?css)$/);
        rebootOn(false, "CSS", logbold.yellow, [feg + '.css', feg + '.scss'], _ => fe.rebuild());
    }

    if (fs.existsSync(fe.staticdir)) {
        rebootOn(false, `FE:${fe.static}`, logbold.magenta, path.join(srcdir, fe.static, g), _ => fe.rebuild(true));
    }
}