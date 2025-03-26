import sapp from "./dist/index.js";
import argv from "./dist/uni/argv.js";
import parseEnvs from "./dist/uni/env.js";

const { isBuild } = argv;

console.log(parseEnvs("dev"));

sapp({
    isBuild,
    demodir:"test/demo",
    distdir:"test/dist",
    srcdir:"test/src",
    info:{
        top:"best",
        arr:["three"]
    },
    be:{
        io:{
            test:"bar"
        }
    },
    fe:{
        loader:{
            ".js":"jsx",
            '.png': 'file',
            ".jpg": "file",
            ".gif": "file",
            ".eot": "file",
            ".woff": "file",
            ".ttf": "file",
            ".md":"text",
            ".jsonc":"json"
        }
    }
})