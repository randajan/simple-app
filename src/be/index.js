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
        }

        const port = portOverride || info.port;
        const http = createServerHTTP(requestListener);
        const io = new IO(http, __sapp_io_config);

        http.on("connection", c => {
            c.id = _p.cid++;
            _p.clients[c.id] = c;
            c.on("close", _ => delete _p.clients[c.id]);
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
    
        const stop = async (action="stop", source="BE")=>{
            if ( _p.state === "stopped" ) { return this; }
            if ( _p.state === "starting" ) { await _p.startProcess; }
            io.emit(info.guid, action, source);
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
            info: { enumerable, value:info },
            start: { value:start },
            stop: { value:stop },
            restart:{ value:restart }
        });

    }

}

let state = true;
parentPort.on("message", msg => {
    const [ action, source ] = msg.split(":");
    if (action === "exit") { process.exit(0); }
    else if (action === "rebuild" && (source === "BE" || source === "Arc")) { process.exit(11); }
    else if (action === "restart") { _servers.forEach(s=>s.io.emit(info.guid, "refresh", source)); }
});

process.on("exit", code => {
    if (!state) { return; }
    state = false;
    const action = code === 11 ? "refresh" : "stop";
    _servers.forEach(s=>s.stop(action));
})

process.on('uncaughtException', e => console.warn(e.stack));