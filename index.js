
const { watch } = require('chokidar');
const { build } = require('esbuild');
const fs = require('fs-extra');

const port = 3000;

const { NODE_ENV, npm_package_version, npm_package_name, npm_package_author_name } = process.env;
const info = process.info = {
  name:npm_package_name,
  version:npm_package_version,
  author:npm_package_author_name,
  env:NODE_ENV,
  isDev:NODE_ENV === "dev"
}

const buildParams = {
  color: true,
  entryPoints: ['frontend/src/index.tsx'],
  loader: { '.ts': 'tsx' },
  outdir: 'frontend/build',
  minify: !info.isDev,
  format: 'cjs',
  bundle: true,
  sourcemap: true,
  logLevel: 'error',
  incremental: true,
  define:{process:JSON.stringify(info)}
};

const log = (msg, color)=>console.log(color, `${info.env}:${info.version}`, "|", (new Date()).toLocaleTimeString("cs-CZ"), "|", msg, "\x1b[0m");

(async () => {
  fs.removeSync('frontend/build');
  fs.copySync('frontend/public', 'frontend/build');

  const builder = await build(buildParams);
  let reboot = await require("./backend/index.js").boot(port);
  log(`App started at port ${port}`, "\x1b[1m\x1b[32m");
 
  if (info.isDev) {

    watch('backend/**/*', { ignoreInitial: true }).on('all', async _=>{
      for (let i in require.cache) { delete require.cache[i]; }
      reboot = await reboot(require("./backend/index.js").boot);
      log("BE rebooted", "\x1b[1m\x1b[35m");
    });

    watch('frontend/src/**/*', { ignoreInitial: true }).on('all', async _=> {
      await builder.rebuild();
      await reboot();
      log("FE rebuilded", "\x1b[1m\x1b[34m");
    });

  }
})();
