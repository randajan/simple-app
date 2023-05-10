import { parentPort } from "worker_threads";

import { createServer } from "http";

import koa from "koa";
import { Server as IO } from "socket.io";
import { info, log } from "../info";

const app = koa();
const http = createServer(app);
const io = new IO(http);

const clients = {};
const sockets = {};

let _cid = 0;
http.on("connection", c=>{
    c.id = _cid ++;
    clients[c.id] = c;
    c.on("close", _=>delete clients[c.id]);
});
       
io.on("connection", s=>{
    sockets[s.id] = s;
    s.on("disconnect", _=>delete sockets[s.id]);
});

let listener;
await new Promise((res, rej)=>{
    try { listener = http.listen(info.port, _=>res()); } catch (e) { rej(e); }
});

const enumerable = true;
const fe = Object.defineProperties({}, {
    clients:{enumerable, get:_=>Object.assign({}, clients)},
    sockets:{enumerable, get:_=>Object.assign({}, sockets)},
});

const cleanUp = _=>Object.values(fe.clients).forEach(c=>c.destroy());
const emit = msg=>io.emit("system", msg);

let state = 1;
parentPort.on("message", msg=>{
    if (msg==="stop") { http.close(); state = 0; setTimeout(_=>_, 60000); }
    if (msg==="shutdown") { process.exit(0); }
    if (msg.startsWith("refresh")) {
        if (state) { emit(msg); cleanUp(); }
        else { process.exit(0); }
    }
});

process.on("exit", _=>{
    emit(state ? "shutdown" : "refresh");
    cleanUp();
})

process.on('uncaughtException', e=>{
  console.log(e.stack);
});

export default Object.defineProperties({}, {
    app:{enumerable, value:app},
    http:{enumerable, value:http},
    io:{enumerable, value:io},
    listener:{enumerable, value:listener},
    fe:{enumerable, value:fe},
    info:{enumerable, value:info}
});

export {
    app,
    http,
    io,
    listener,
    fe,
    info
}