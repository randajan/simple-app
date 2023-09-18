import sapp, { argv, envs } from "./dist/index.js";

sapp(argv.env === "prod", {
    port:4005,
    distdir:"test/dist",
    srcdir:"test/src",
    //info:{foo:"bar", test:["array"]},
    fe:{
        info:{...envs()}
    }
})