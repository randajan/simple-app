import slib from "@randajan/simple-lib";

slib(true, {
    mode: "node",
    lib:{
        minify:false,
        entries:[
            "index.js",
            "be/index.js",
            "be/server.js",
            "be/express.js",
            "be/koa.js",
            "fe/index.js",
            "uni/info.js",
            "uni/env.js",
            "uni/argv.js",
            "uni/log.js",
            "uni/fs.js"
        ]
    }
})