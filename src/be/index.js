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

        const start = async _=>{
            if ( _p.state !== "stopped" ) { return _p.startProcess; }
            _p.state = "starting";
            return _p.startProcess = new Promise((res, rej) => {
                try { const listener = http.listen(port, _ =>{
                    _p.state = "started";
                    res(_p.listener = listener);
                }); }
                catch (e) { rej(e); }
            });
        }
    
        const stop = async (msg, ...msgs)=>{
            if ( _p.state === "stopped" ) { return this; }
            if ( _p.state === "starting" ) { await _p.startProcess; }
            io.emit("system", msg || "stop", ...msgs);
            Object.values(_p.clients).forEach(c => c.destroy());
            http.close();
            return this;
        }
    
        const restart = () => { return stop("refresh").start(); }

        Object.defineProperties(this, {
            id: { value:_servers.push(this)-1 },
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
            info: { enumerable, value:info },
            start: { value:start },
            stop: { value:stop },
            restart:{ value:restart }
        });

    }

}

let state = true;
parentPort.on("message", msg => {
    const [ action, target ] = msg.split(":");
    if (action === "exit") { process.exit(0); }
    else if (action === "rebuild" && (target === "BE" || target === "Arc")) { process.exit(11); }
    else if (action === "restart") { _servers.forEach(s=>s.io.emit("system", "refresh", target)); }
});

process.on("exit", code => {
    if (!state) { return; }
    state = false;
    const msg = code === 11 ? "refresh" : "";
    _servers.forEach(s=>s.stop(msg));
})

process.on('uncaughtException', e => log.red(e.stack));
