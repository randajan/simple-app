
import socketIOClient from "socket.io-client";

import { info, log } from "../info";

const socket = socketIOClient(info.home.host);

socket.on(info.guid, (action, source)=>{
    if (action === "stop") { window.close(); } 
    else if (action === "refresh") {
        if (source !== "CSS") { setTimeout(_=>location.reload(), 100); }
        else {
            for (const link of document.querySelectorAll("link[rel=stylesheet]")) {
                if (!link.href) { continue; }
                const url = new URL(link.href);
                url.searchParams.delete("updated_at");
                url.searchParams.append("updated_at", Date.now());
                link.href = url.toString();
            }
        }
    }
});

const enumerable = true;
export default Object.defineProperties({}, {
    log:{enumerable, value:log},
    info:{enumerable, value:info}
})

export {
    socket,
    log,
    info
}