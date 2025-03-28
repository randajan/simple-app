import sapp from "./dist/index.js";
import argv from "./dist/uni/argv.js";

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