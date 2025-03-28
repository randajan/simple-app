
import socketIOClient from "socket.io-client";

import { info } from "../uni/info.js";
import defs from "../uni/_defs.js";

const socket = socketIOClient(window.location.host, defs?.io);

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

export default Object.freeze({
    socket,
    info,
});

export {
    socket,
    info,
}