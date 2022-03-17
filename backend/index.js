const express = require("express");

const app = express();
const server = require("http").createServer(app);
const io = require('socket.io')(server);

const clients = Object.defineProperties({}, {
    lastId:{value:0, writable:true},
    count:{value:0, writable:true},
    reload:{value:msg=>{ for (let i in clients) { clients[i].emit("reload", msg); }}}
})

io.on("connection", client=>{
    const id = clients.lastId++;
    clients[id] = client;
    clients.count++;
    client.on("disconnect", _=>{
        delete clients[id];
        clients.count--;
    });
});

require("./middleware.js").default(app, io);
require("./routes.js").default(app, io);

exports.boot = async port=>new Promise((resolve, reject)=>{
    const reboot = async boot=>{
        if (!boot) { clients.reload(); return; }
        server.close();
        const next = await boot(port);
        clients.reload();
        return next;
    }
    server.port = port;
    try { server.listen(port, _=>resolve(reboot)); } catch (e) { reject(e); return; }
});