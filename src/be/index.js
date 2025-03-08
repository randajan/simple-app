import { parentPort } from "worker_threads";

import { createServer as createServerHTTP } from "http";

import { Server as IO } from "socket.io";
import { info } from "../info";
import EventEmitter from "events";
import { detect } from "detect-port";

const enumerable = true;
const _servers = new Map();

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
            
            _p.port = http.address()?.port;
            _p.state = _p.port ? "running" : "stopped";
            if (_p.port) {
                _p.portLast = _p.port;
                parentPort?.postMessage([this.id, _p.port, autoOpen]);
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

    async stop(action = "stop", source = "BE") {
        const _p = _servers.get(this);
        if (_p.stopProcess) { return _p.stopProcess; }
        if (_p.state === "stopped") { return true; }
        if (_p.startProcess) { await _p.startProcess; }

        this.io.emit(info.guid, action, source);
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
        if (!await this.stop("refresh")) { return false; }
        return this.start();
    }
}

const exit = async action=>{
    await Server.map(s=>s.stop(action));
    process.exit(0);
}

parentPort?.on("message", async ([action, source]) => {
    if (action === "exit") { exit(); }
    else if (action === "rebuild" && (source === "BE" || source === "Arc")) { exit("refresh"); }
    else if (action === "restart") { Server.map(s => s.io.emit(info.guid, "refresh", source)); }
});

["SIGTERM", "SIGINT", "SIGQUIT"].forEach(signal=>process.on(signal, _=>exit()));

process.on('uncaughtException', e => console.warn(e.stack));

