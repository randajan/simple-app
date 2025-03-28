# Simple node.js app

[![NPM](https://img.shields.io/npm/v/@randajan/simple-app.svg)](https://www.npmjs.com/package/@randajan/simple-lib) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

Goal is to provide supersimple start for developing and deploying full stack app in one package

## Instalation

```console
npm install -D @randajan/simple-app;
```

or

```console
yarn add -D @randajan/simple-app;
```

## Usage

```javascript
import sapp from "@randajan/simple-app";

//those values are default values

sapp({
  isBuild:false,            //false = start dev server; true = generate minify build
  distdir:"dist",           //directory of build
  demodir:"demo",           //directory of dev server
  srcdir:"src",             //directory of source code
  arcdir:"arc",             //directory for shared code by frontend and backend
  rebuildBuffer:100,        //delay between src changed and rebuild happend
  plugins:[],               //global esbuild plugins
  loader:{},                //global esbuild loader
  info:{},                  //variables accessible via import info from "@randajan/simple-app/info"
  env:{                     //optional config for maitained env file
    name:undefined,         //env file that will be used (when isBuild=true this is ignored)
    dir:"env",              //directory for all used env files
  }
  be:{                      //backend options
    dir:"backend",          //backend subdirectory
    format:"esm",           //backend format
    minify:isBuild,         //backend minify - true = generate minify build; if null then isProd 
    entries:["index.js"],   //backend entry files
    external:undefined,     //backend if not provided esbuild will keep all node_modules external
    plugins:[],             //backend esbuild plugins
    loader:{},              //backend esbuild loader
    io:{},                  //backend default io config
    static:"private",       //backend static content folder name
    injects:[],             //backend files where info variables will be injected between brackets {{name}}
    info:{},                //variables accessible only at backend via import info from "@randajan/simple-app/info"
  },
  fe:{                      //frontend options
    dir:"frontend",         //frontend subdirectory
    minify:isProd,          //frontend minify - true = generate minify build; if null then isProd 
    entries:["index.js"],   //frontend entry files
    plugins:[],             //frontend esbuild plugins
    loader:{},              //frontend esbuild loader
    io:{},                  //frontend default io config
    static:"public",        //frontend static content folder name
    injects:["index.html"], //frontend files where info variables will be injected between brackets {{name}}
    info:{},                //variables accessible only at frontend via import info from "@randajan/simple-app/info"
  }
})

```

After run will be generated necessary file structure.

## Requirements

```javascript
...
    "@randajan/std-io": "^1.0.2",
    "chalk": "^5.3.0",
    "chokidar": "^3.6.0",
    "detect-port": "^2.1.0",
    "esbuild": "^0.25.1",
    "esbuild-node-externals": "^1.18.0",
    "fs-extra": "^11.2.0",
    "open": "^10.1.0",
    "socket.io": "^4.7.5",
    "socket.io-client": "^4.7.5"
...
```

## Backend
Prepared servers:

- @randajan/simple-app/be/express
- @randajan/simple-app/be/koa

Or you can implement your own 
- @randajan/simple-app/be/server

Or you can use it even without http server at all
- @randajan/simple-app/be

### Env


Happy hacking

## License

MIT © [randajan](https://github.com/randajan)