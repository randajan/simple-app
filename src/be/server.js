import { createServer as createServerHTTP } from "http";

import { Server as IO } from "socket.io";
import { info } from "../info";
import EventEmitter from "events";
import { detect } from "detect-port";
import { onStop, onRestart, std, Std, stop, restart } from ".";

const enumerable = true;
const _servers = new Map();

onStop(isRestart=>Server.map(s=>s.stop(isRestart)));
onRestart(source=>Server.map(s => s.io.emit(info.guid, true, source)));

export {
    Std, std, stop, restart,
    onStop,
    onRestart
}

export class Server extends EventEmitter {

    static async map(callback) {
        return Promise.all([..._servers.keys()].map(callback));
    }

    static async choosePort(...ports) {
        let _offer;
        for (const port of ports) {
            const offer = await detect(port);
            if (port === offer) { return port; }
            if (ports.includes(offer)) { return offer; }
            if (!_offer) { _offer = offer; }
        }
        return _offer;
    }

    constructor(requestListener, autoOpen=false) {
        super();

        const _p = {
            cid: 0,
            state: "stopped", //state stopped, starting, started
            clients:new Map(),
        }

        _servers.set(this, _p);

        const http = createServerHTTP(requestListener);
        const io = new IO(http, __sapp_io_config);

        const restate = _=>{
            
            const port = _p.port = http.address()?.port;
            _p.state = port ? "running" : "stopped";
            if (port) {
                _p.portLast = port;
                std.post({type:"httpServer", id:this.id, port, autoOpen});
            }
            this.emit("state", _p.state, _p.port);
        }

        http.on("listening", restate);
        http.on("close", restate);

        http.on("error", async err=>{
            restate();
            if (err.code != "EADDRINUSE" && !_p.port) { await this.restart(); }
            this.emit("error", err);
        });

        http.on("connection", c => {
            c.id = _p.cid++;
            _p.clients.set(c.id, c);
            c.on("close", _ => _p.clients.delete(c.id));
        });

        Object.defineProperties(this, {
            id:{ enumerable, value:_servers.size},
            state: { enumerable, get: _ => _p.state },
            port: { enumerable, get: _=> _p.port },
            http: { value: http },
            clients: { get:_=>new Map(_p.clients) },
            io: { value: io },
        });

    }

    async start(...ports) {
        const _p = _servers.get(this);
        if (_p.startProcess) { return _p.startProcess; }
        if (_p.state !== "stopped") { return false; }
        _p.state = "starting";

        const port = !ports.length ? (_p.portLast||0) : await Server.choosePort(...ports);

        return _p.startProcess = new Promise((res, rej) => {
            this.http.once('error', err=>{
                delete _p.startProcess;
                rej(err);
            });

            this.http.listen(port, _=>{
                delete _p.startProcess;
                res(true);
            });
        });
    }

    async stop(isRestart=false) {
        const _p = _servers.get(this);
        if (_p.stopProcess) { return _p.stopProcess; }
        if (_p.state === "stopped") { return true; }
        if (_p.startProcess) { await _p.startProcess; }

        this.io.emit(info.guid, isRestart);
        for (const c of _p.clients.values()) { c.destroy(); }
        _p.clients.clear();
        _p.cid = 0;
        
        return _p.stopProcess = new Promise((res, rej) => {
            this.http.once('error', err=>{
                delete _p.stopProcess;
                rej(err);
            });
            this.http.close(_=>{
                delete _p.stopProcess;
                res(true);
            });
        });
    }

    async restart() {
        if (!await this.stop(true)) { return false; }
        return this.start();
    }
}

