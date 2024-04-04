import { Worker } from "worker_threads";
import { watch } from "chokidar";
import fs from "fs-extra";
import open from "open";

import argv from "./tools/argv.js";
import { injectFile } from "./tools/inject.js";

import templates from "./tools/templates.js";
import { root, envs, parseConfig } from "./tools/config.js";

export { root, argv, envs }

export default async (isProd=false, config={})=>{
  const { port, srcdir, distdir, fe, be, injects, rebuildBuffer, log } = parseConfig(isProd, config);
  const logbold = log.bold;
  const logred = logbold.red;

  const buildPublic = async removeDir=>{
    if (removeDir) { await fs.remove(removeDir); }
    await fs.copy(srcdir+'/public', fe.distdir);
    await Promise.all(injects.map(file=>injectFile(fe.distdir+"/"+file, fe.info)));
  };

  if (!fs.existsSync(srcdir)) {
    await Promise.all([
      fs.outputFile(srcdir+'/public/index.html', templates.index),
      fs.outputFile(srcdir+"/arc/index.js", templates.arc),
      fs.outputFile(be.srcdir+"/index.js", templates.be),
      fs.outputFile(fe.srcdir+"/index.js", templates.fe),
      fs.outputFile(fe.srcdir+'/index.css', templates.css),
    ]);
  }

  await buildPublic(distdir);
  await be.rebuild();
  await fe.rebuild();

  const rebootBE = async _=>{
    await be.rebuild();
    be.current = new Worker(("./"+be.distdir+"/index.js").replaceAll("\\", "/"));
  }

  const rebootFE = async (rebuildPublic=false)=>{
    if (rebuildPublic) { await buildPublic(fe.dist); }
    await fe.rebuild();
  }

  ["SIGTERM", "SIGINT", "SIGQUIT"].forEach(signal=>{
    process.on(signal, _=>{
      be.current.on("exit", _=>process.exit(0));
      be.current.postMessage("exit");
    });
  })

  logbold.inverse(`Started at ${be.info.home.origin}`);

  await rebootBE();

  if (isProd) { return; }

  const rebootOn = (name, customLog, path, exe, ignored)=>{
    const reboot = async _=>{
      const msg = name+" change";
      const current = be.current;
      if (current) { current.postMessage("rebuild:"+name); }
      try { await exe(); } catch(e) { logred(msg, "failed"); log(e.stack); return; };
      if (current) { current.postMessage("restart:"+name); }
      customLog(msg+"d");
    }

    let timer;
    watch(path, { ignoreInitial:true, ignored }).on('all', (...args)=>{
      clearTimeout(timer);
      timer = setTimeout(reboot, rebuildBuffer);
    });
  }

  rebootOn("Public", logbold.magenta, srcdir+'/public/**/*', _=>rebootFE(true));
  rebootOn("Arc", logbold.cyan, srcdir+'/arc/**/*', _=>Promise.all([rebootBE(), rebootFE()]));
  rebootOn("CSS", logbold.yellow, [fe.srcdir+'/**/*.css', fe.srcdir+'/**/*.scss'], _=>rebootFE());
  rebootOn("FE", logbold.green, fe.srcdir+'/**/*', _=>rebootFE(), /(\.s?css)$/);
  rebootOn("BE", logbold.blue, be.srcdir+'/**/*', _=>rebootBE());

  open(be.info.home.origin);

}