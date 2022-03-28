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
  dev:false,                            //true = start dev server; false = generate minify build and start prod server
  port:3000,                            //port of server
  home:`http://localhost:${port}`,      //home url
  srcdir:"src",                         //directory of source code
  distdir:"dist",                       //directory of build
  fedir:"frontend",                     //subdirectory of frontend
  bedir:"backend"                       //subdirectory of backend
  define:{},                            //variables accessible at both FE and BE through global variable "__sapp"
  bedefine:{},                          //variables accessible only at BE through global variable "__sapp"
  fedefine:{},                          //variables accessible only at FE through global variable "__sapp"
})

```

After run will be generated necessary file structure.


## Requirements

```javascript
...
    "app-root-path": "^3.0.0",
    "chokidar": "^3.5.3",
    "esbuild": "^0.14.28",
    "esbuild-node-externals": "^1.4.1",
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