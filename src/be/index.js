import { parentPort } from "worker_threads";

import { createServer as createServerHTTP } from "http";

import { Server as IO } from "socket.io";
import { info, log } from "../info";

const _servers = [];
const enumerable = true;

export class Server {
    constructor(requestListener, portOverride = null) {
        const _p = {
            cid: 0,
            listener: null,
            state:"stopped", //state stopped, starting, started
            clients:{},
            sockets:{}
        }

        const port = portOverride || info.port;
        const http = createServerHTTP(requestListener);
        const io = new IO(http);

        http.on("connection", c => {
            c.id = _p.cid++;
            _p.clients[c.id] = c;
            c.on("close", _ => delete _p.clients[c.id]);
        });

        io.on("connection", s => {
            _p.sockets[s.id] = s;
            s.on("disconnect", _ => delete _p.sockets[s.id]);
        });

        Object.defineProperties(this, {
            id: { value:_servers.push({ instance:this, private:_p })-1 },
            state: { enumerable, get: _ => _p.state },
            port: { enumerable, value: port },
            http: { value: http },
            io: { value: io },
            listener: { get:_=>_p.listener },
            bridge: {
                enumerable, value: Object.defineProperties({}, {
                    clients: { enumerable, get: _ => ({ ..._p.clients }) },
                    sockets: { enumerable, get: _ => ({ ..._p.sockets }) },
                })
            },
            info: { enumerable, value:info }
        });

    }

    async start() {
        const _p = _servers[this.id].private;

        if ( _p.state !== "stopped" ) { return _p.startProcess; }
        _p.state = "starting";
        return _p.startProcess = new Promise((res, rej) => {
            try { const listener = this.http.listen(this.port, _ =>{
                _p.state = "started";
                res(_p.listener = listener);
            }); }
            catch (e) { rej(e); }
        });
    }

    async stop() {
        const _p = _servers[this.id].private;

        if ( _p.state === "stopped" ) { return this; }
        if ( _p.state === "starting" ) { await _p.startProcess; }
        Object.values(_p.clients).forEach(c => c.destroy());
        this.http.close();
        return this;
    }

    restart() { return this.stop().start(); }

}

let state = true;
parentPort.on("message", msg => {
    if (msg === "stop") {
        state = false;
        _servers.forEach(s=>s.instance.stop());
        setTimeout(_ => _, 60000);
    }
    if (msg === "shutdown") { process.exit(0); }
    if (msg.startsWith("refresh")) {
        if (!state) { process.exit(0); } else {
            _servers.forEach(s=>s.instance.io.emit("system", msg));
        }
    }
});

process.on("exit", _ => {
    _servers.forEach(s=>s.instance.io.emit("system", state ? "shutdown" : "refresh"));
})

process.on('uncaughtException', e => log.red(e.stack));
