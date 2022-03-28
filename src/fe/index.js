
import socketIOClient from "socket.io-client";

import info from "../info";

const socket = socketIOClient(info.home.host);
socket.on("reboot", _=>setTimeout(_=>location.reload(), 100));

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