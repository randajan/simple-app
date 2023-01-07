
export default _=>({
    index:`
<!DOCTYPE html>
<html lang="en">

<head>
<meta charset="UTF-8">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="{{description}}" />
<title>{{name}} v{{version}} by {{author}}</title>
</head>

<body>
<div id="root"></div>
<script src="index.js"></script>
</body>

</html>
`,
    arc:`
import info from "@randajan/simple-app/info";

export default _=>"hello world "+JSON.stringify(info);
`,
    be:`
import be, { express, app, http, io, listener, fe, info } from "@randajan/simple-app/be";
import helloworld from "../arc";

app.use("/", express.static(info.dir.fe));

setTimeout(_=>console.log(helloworld()));
`,
    fe:`
import fe, { be, info } from "@randajan/simple-app/fe";
import helloworld from "../arc";

document.getElementById("root").innerText = helloworld();
`
});