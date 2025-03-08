
import socketIOClient from "socket.io-client";

import { info } from "../info";
import { importFiles } from "../tools/importFiles";

const socket = socketIOClient(window.location.host, __sapp_io_config);

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
    socket:{enumerable, value:socket},
    info:{enumerable, value:info},
    importFiles:{enumerable, value:importFiles}
});

export {
    socket,
    info,
    importFiles
}