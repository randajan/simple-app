
import socketIOClient from "socket.io-client";

import info from "../info";

const socket = socketIOClient(info.home.host);
socket.on("system", msg=>{
    if (msg === "refresh") { setTimeout(_=>location.reload(), 100); }
    if (msg === "shutdown") { window.close(); }    
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