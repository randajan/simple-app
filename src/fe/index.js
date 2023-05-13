
import socketIOClient from "socket.io-client";

import { info, log } from "../info";

const socket = socketIOClient(info.home.host);
socket.on("system", (action, target)=>{
    console.log(action, target);

    if (action === "stop") { window.close(); } 
    else if (action === "refresh") {
        if (target !== "CSS") { setTimeout(_=>location.reload(), 100); }
        else {
            for (let link of document.querySelectorAll("link[rel=stylesheet]")) {
                link.href = link.href.replace(/\?.*|$/, "?" + Date.now())
            }
        }
    }
});

const enumerable = true;
const bridge = Object.defineProperties({}, {
    socket:{enumerable, value:socket}
});

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