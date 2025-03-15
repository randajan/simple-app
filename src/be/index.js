import { parentPort } from "worker_threads";

const _beforeStop = new Set();
const _beforeRefresh = new Set();

export const onStop = (cb)=>{
    _beforeStop.add(cb);
    return _=>{ _beforeStop.delete(cb); }
}

export const onRefresh = (cb)=>{
    _beforeRefresh.add(cb);
    return _=>{ _beforeRefresh.delete(cb); }
}

const stop = async (isRestart)=>{
    await Promise.all([..._beforeStop].map(cb=>cb(isRestart)));
    process.exit(0);
}

const refresh = async (source)=>{
    await Promise.all([..._beforeRefresh].map(cb=>cb(source)));
}

parentPort?.on("message", async ([action, source]) => {
    if (action === "stop") { await stop(); }
    else if (action === "restart" && (source === "BE" || source === "Arc")) { await stop(true); }
    else if (action === "refresh") { await refresh(source); }
});

["SIGTERM", "SIGINT", "SIGQUIT"].forEach(signal=>process.on(signal, _=>stop(false)));

process.on('uncaughtException', e => console.error(e));

