import { watch } from "chokidar";
import fse from "fs-extra";
import open from "open";

import templates from "./tools/templates.js";
import { parseConfig } from "./tools/config.js";

import { spawn } from "child_process";
import path from "path";
import { StdIO } from "@randajan/std-io";

export default async (config = {}) => {
    const { isBuild, distdir, srcdir, arcdir, fe, be, env, rebuildBuffer, log } = parseConfig(config);
    const logbold = log.bold;
    const logred = logbold.red;
    const logmain = log.inverse;

    
    if (!fse.existsSync(srcdir)) {
        await Promise.all([
            fse.outputFile(path.join(fe.staticdir, 'index.html'), templates.index),
            fse.outputFile(path.join(arcdir, "index.js"), templates.arc),
            fse.outputFile(path.join(be.srcdir, "index.js"), templates.be),
            fse.outputFile(path.join(fe.srcdir, "index.js"), templates.fe),
            fse.outputFile(path.join(fe.srcdir, 'index.css'), templates.css),
        ]);
    }

    if (isBuild) {
        logbold.yellow(`Creating production build...`);
        await Promise.all([be.rebuild(true, true, true), fe.rebuild(true, true)]);
        logbold.green(`Succesfully builded ${distdir}`);
        logbold.blue(`You can run it with 'node ${path.join(be.distdir)}'`);
        process.exit(0);
    }

    const servers = new Map();
    const beRebuild = async (rebuildStatic=false, cleanUp=false, rebuildEnv=false)=> {

        await be.rebuild(rebuildStatic, cleanUp, rebuildEnv);
        be.current = spawn("node", ["./index.js", ...process.argv.slice(2)], {
            stdio: ["pipe", "pipe", "pipe"],
            cwd:be.distdir
        });
        be.std = new StdIO({process:be.current});
        be.std.rx("log", console.log);
        be.std.rx("error", err=>console.error(err));
        be.std.rx("http", ({id:serverId, port, autoOpen})=>{
            const knownPort = servers.get(serverId);
            if (knownPort === port) { return false; }
            servers.set(serverId, port);
            logmain(`Server id '${serverId}'`, `${knownPort ? "re" : ""}started at port '${port}'`);
            if (autoOpen) { open(`http://localhost:${port}`); }
            return true;
        });
    }

    logmain(`Initializing development environment...`);
    await Promise.all([beRebuild(true, true, true), fe.rebuild(true, true)]);
    

    ["SIGTERM", "SIGINT", "SIGQUIT"].forEach(signal => {
        process.on(signal, async _ => {

            be.current.once("exit", _ => process.exit(0));
            
            try { await be.std.tx("cmd", {cmd:"stop"}); }
            catch { process.exit(0); }
        });
    });

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

    if (fse.existsSync(be.srcdir)) {
        rebootOn(true, "BE", logbold.blueBright, path.join(be.srcdir, g), _ => beRebuild());
    }

    if (fse.existsSync(env.src)) {
        rebootOn(true, "Env", logbold.magenta, env.src, _ => beRebuild(false, false, true));
    }

    if (fse.existsSync(be.staticdir)) {
        rebootOn(true, `Private`, logbold.blue, path.join(be.staticdir, g), _ => beRebuild(true));
    }
    
    if (fse.existsSync(arcdir)) {
        rebootOn(true, "Arc", logbold.cyan, path.join(arcdir, g), _ => Promise.all([beRebuild(), fe.rebuild()]));
    }

    if (fse.existsSync(fe.srcdir)) {
        rebootOn(false, "FE", logbold.greenBright, feg, _ => fe.rebuild(), /(\.s?css)$/);
        rebootOn(false, "CSS", logbold.yellow, [feg + '.css', feg + '.scss'], _ => fe.rebuild());
    }

    if (fse.existsSync(fe.staticdir)) {
        rebootOn(false, `Public`, logbold.green, path.join(fe.staticdir, g), _ => fe.rebuild(true));
    }
}