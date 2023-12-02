
import socketIOClient from "socket.io-client";

import { info, log } from "../info";
import { FrontendBridge } from "./bridge/FrontendBridge";

const socket = socketIOClient(info.home.host);
const bridge = new FrontendBridge(socket);

bridge.rx("$$system", ({ action, source })=>{
    if (action === "stop") { window.close(); } 
    else if (action === "refresh") {
        if (source !== "CSS") { setTimeout(_=>location.reload(), 100); }
        else {
            for (let link of document.querySelectorAll("link[rel=stylesheet]")) {
                link.href = link.href.replace(/\?.*|$/, "?" + Date.now())
            }
        }
    }
});


const enumerable = true;
export default Object.defineProperties({}, {
    bridge:{enumerable, value:bridge},
    log:{enumerable, value:log},
    info:{enumerable, value:info}
})

export {
    bridge,
    log,
    info
}