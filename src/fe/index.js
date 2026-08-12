
import socketIOClient from "socket.io-client";

import { info } from "../uni/info.js";
import defs from "../uni/_defs.js";

let currentSocket;

const createSocket = (options={}, isBuild)=>{
    isBuild = isBuild == null ? info.isBuild : !!isBuild;
    
    const opt = {...(defs?.io || {}), ...options};
    const { namespace="", ...ioOpt } = opt;

    const socket = socketIOClient(window.location.host+namespace, ioOpt);

    if (isBuild) { return socket; }

    socket.on(info.guid, (isRestart, source)=>{
        if (!isRestart) { window.close(); } 
        else if (source !== "CSS") { setTimeout(_=>location.reload(), 100); }
        else {
            for (const link of document.querySelectorAll("link[rel=stylesheet]")) {
                if (!link.href) { continue; }
                const url = new URL(link.href);
                url.searchParams.delete("updated_at");
                url.searchParams.append("updated_at", Date.now());
                link.href = url.toString();
            }
        }
    });

    return socket;
}

const initSocket = (options, isBuild)=>{
    if (currentSocket) { throw new Error("@randajan/simple-app: You can't initSocket(...) more than once"); }
    return currentSocket = createSocket(options, isBuild);
}

const getSocket = ()=>currentSocket || initSocket();

const exp = {
    initSocket,
    getSocket,
    info
}

Object.defineProperty(exp, "socket", {
    get:_=>{ throw new Error("@randajan/simple-app socket property is obsolete please use getSocket() or initSocket() instead"); }
});

export default Object.freeze(exp);

export {
    initSocket,
    getSocket,
    info,
}
