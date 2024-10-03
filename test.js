import sapp, { argv } from "./dist/index.js";

sapp(argv.env === "prod", {
    port:4005,
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