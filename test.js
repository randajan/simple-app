import sapp from "./dist/esm/index.mjs";
import argv from "./dist/esm/uni/argv.mjs";

const { isBuild } = argv;

sapp({
    isBuild,
    demodir:"test/demo",
    distdir:"test/dist",
    srcdir:"test/src",
    include:["yarn.lock"],
    info:{
        top:"best",
        arr:["three"]
    },
    env:{
        name:"dev"
    },
    be:{
        format:"esm",
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
});