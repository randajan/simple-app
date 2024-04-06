import sapp, { argv } from "./dist/index.js";

sapp(argv.env === "prod", {
    port:4005,
    distdir:"test/dist",
    srcdir:"test/src",
    info:{
        top:"best",
        arr:["three"]
    }
})