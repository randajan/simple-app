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

sapp(
  isProd=true                           //false = start dev server; true = generate minify build and start prod server
  {
    port:3000,                          //port of server
    srcdir:"src",                       //directory of source code
    distdir:"dist",                     //directory of build
    rebuildBuffer:100,                  //delay between src changed and rebuild happend
    external:[],                        //global esbuild external libraries
    plugins:[],                         //global esbuild plugins
    loader:{},                          //global esbuild loader
    info:{
      home:`http://localhost:${port}`   //home url
    },                                  //variables accessible via import info from "@randajan/simple-app/info"
    injects:["index.html"],             //dist/frontend files where info variables will be injected between brackets {{name}}
    be:{                                //backend options
      dir:"backend",                    //backend subdirectory
      minify:isProd,                    //backend minify - true = generate minify build; if null then isProd 
      entries:["index.js"],             //backend entry files
      external:[],                      //backend esbuild external libraries
      plugins:[],                       //backend esbuild plugins
      loader:{},                        //backend esbuild loader
      info:{},                          //variables accessible only at backend via import info from "@randajan/simple-app/info"
    },
    fe:{                                //frontend options
      dir:"frontend",                   //frontend subdirectory
      minify:isProd,                    //frontend minify - true = generate minify build; if null then isProd 
      entries:["index.js"],             //frontend entry files
      external:[],                      //frontend esbuild external libraries
      plugins:[],                       //frontend esbuild plugins
      loader:{},                        //frontend esbuild loader
      info:{},                          //variables accessible only at frontend via import info from "@randajan/simple-app/info"
    }
  }
)

```

After run will be generated necessary file structure.


## Requirements

```javascript
...
    "app-root-path": "^3.0.0",
    "chalk": "^5.2.0",
    "chokidar": "^3.5.3",
    "esbuild": "^0.14.28",
    "esbuild-node-externals": "^1.7.0",
    "express": "^4.17.3",
    "fs-extra": "^10.0.0",
    "open": "^8.4.0",
    "socket.io": "^4.4.1",
    "socket.io-client": "^4.4.1"
...
```


Happy hacking

## License

MIT © [randajan](https://github.com/randajan)