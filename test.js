import sapp from "./dist/esm/index.mjs";
import argv from "./dist/esm/uni/argv.mjs";

const { isBuild } = argv;

sapp({
    isBuild,
    demodir:"test/demo",
    distdir:"test/dist",
    srcdir:"test/src",
    info:{
        top:"best",
        arr:["three"]
    },
    env:{
        name:"dev"
    },
    be:{
        format:"esm",
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
});