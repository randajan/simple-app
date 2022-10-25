import sapp, { argv } from "./dist/index.js";


sapp(false, {
    distdir:"test/dist",
    srcdir:"test/src",
    info:{foo:"bar"},
})