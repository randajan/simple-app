
export default _=>({
    index:`
<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="Supersimple start for developing full stack app with node.js" />
<title>simple-app</title>
</head>

<body>
<div id="root"></div>
<script src="index.js"></script>
</body>

</html>
`,
    arc:`
export default _=>"hello world \\n"+JSON.stringify(__sapp);
`,
    be:`
import express from "express";
import { server, app } from "@randajan/simple-app";
import helloworld from "../arc/index.js";

const be = await server();
app.use("/", express.static(__sapp.dir.fe));

setTimeout(_=>console.log(helloworld()));

export default be;
`,
    fe:`
import socketIOClient from "socket.io-client";
import helloworld from "../arc/index.js";

socketIOClient(__sapp.home.host).on("reboot", _=>setTimeout(_=>location.reload(), 100));
document.getElementById("root").innerText = helloworld();
`
});