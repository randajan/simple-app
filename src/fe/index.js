
import socketIOClient from "socket.io-client";

import info from "../info";

const socket = socketIOClient(info.home.host);
socket.on("system", msg=>{
    if (msg === "shutdown") { window.close(); } 
    else if (msg.startsWith("refresh")) { 
        if (!msg.endsWith("CSS")) { setTimeout(_=>location.reload(), 100); }
        else {
            for (let link of document.querySelectorAll("link[rel=stylesheet]")) {
                link.href = link.href.replace(/\?.*|$/, "?" + Date.now())
            }
        }
    }
});

const enumerable = true;
const be = Object.defineProperties({}, {
    socket:{enumerable, socket:true}
})

export default Object.defineProperties({}, {
    be:{enumerable, value:be},
    info:{enumerable, value:info}
})

export {
    be,
    info
}