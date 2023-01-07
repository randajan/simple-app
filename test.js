import sapp, { argv } from "./dist/index.js";


sapp(true, {
    port:4002,
    distdir:"test/dist",
    srcdir:"test/src",
    info:{foo:"bar", test:[ "array" ]},
})