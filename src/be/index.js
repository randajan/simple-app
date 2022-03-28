import { createServer } from "http";

import express from "express";
import { Server as IO } from "socket.io";
//add every external import to builder

import info from "../info";

const app = express();
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

export default Object.defineProperties({}, {
    express:{enumerable, value:express},
    app:{enumerable, value:app},
    http:{enumerable, value:http},
    io:{enumerable, value:io},
    listener:{enumerable, value:listener},
    fe:{enumerable, value:fe},
    info:{enumerable, value:info}
});
    
export {
    express,
    app,
    http,
    io,
    listener,
    fe,
    info
}