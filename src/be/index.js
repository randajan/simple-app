import { parentPort } from "worker_threads";

import { createServer as createServerHTTP } from "http";

import express from "express";
import { Server as IO } from "socket.io";
import { info, log } from "../info";



const enumerable = true;

class Server {
    constructor(app, portOverride=null) {

        let _cid = 0;
        const clients = {};
        const sockets = {};

        const port = portOverride || info.port;
        const http = createServerHTTP(app);
        const io = new IO(http);

        http.on("connection", c => {
            c.id = _cid++;
            clients[c.id] = c;
            c.on("close", _ => delete clients[c.id]);
        });
    
        io.on("connection", s => {
            sockets[s.id] = s;
            s.on("disconnect", _ => delete sockets[s.id]);
        });

        Object.defineProperties(this, {
            app:{ enumerable, value:app },
            port:{ enumerable, value:port },
            http:{ enumerable, value:http },
            io:{ enumerable, value:io },
            clients: { enumerable, get: _ => Object.assign({}, clients) },
            sockets: { enumerable, get: _ => Object.assign({}, sockets) },
        });

    }

    async start() {
        return new Promise((res, rej) => {
            try { const listener = this.http.listen(this.port, _ => res(listener)); }
            catch (e) { rej(e); }
        });
    }

    async stop() {
        const { http, sockets, clients } = this;
        for (const client of clients) { client.destroy(); }
        for (const socket of sockets) { socket.destroy(); }
        http.close();
    }
}

const cleanUp = _ => Object.values(fe.clients).forEach(c => c.destroy());

let state = 1;
parentPort.on("message", msg => {
    if (msg === "stop") { http.close(); state = 0; setTimeout(_ => _, 60000); }
    if (msg === "shutdown") { process.exit(0); }
    if (msg.startsWith("refresh")) {
        if (state) { io.emit("system", msg); cleanUp(); }
        else { process.exit(0); }
    }
});

process.on("exit", _ => {
    io.emit("system", state ? "shutdown" : "refresh");
    cleanUp();
})

process.on('uncaughtException', e =>log.red(e.stack));

export default Object.defineProperties({}, {
    express: { enumerable, value: express },
    app: { enumerable, value: app },
    http: { enumerable, value: http },
    io: { enumerable, value: io },
    listener: { enumerable, value: listener },
    fe: { enumerable, value: fe },
    info: { enumerable, value: info }
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