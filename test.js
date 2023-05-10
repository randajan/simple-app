import sapp from "./dist/index.js";


sapp(false, {
    port:4005,
    distdir:"test/dist",
    srcdir:"test/src",
    info:{foo:"bar", test:["array"]},
})