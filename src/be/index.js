import { Std } from "../tools/std";

const _beforeStop = new Set();
const _beforeRefresh = new Set();

export const std = new Std(process.stdin, process.stdout);

export const onStop = (cb)=>{
    _beforeStop.add(cb);
    return _=>{ _beforeStop.delete(cb); }
}

export const onRefresh = (cb)=>{
    _beforeRefresh.add(cb);
    return _=>{ _beforeRefresh.delete(cb); }
}

export const stop = async (isRestart)=>{
    const int = setTimeout(_=>process.exit(1), 3000);
    await Promise.all([..._beforeStop].map(cb=>cb(isRestart)));
    clearTimeout(int);
    process.exit(0);
}

export const refresh = async (source)=>{
    await Promise.all([..._beforeRefresh].map(cb=>cb(source)));
}

std.on("data", async ({ type, cmd, source }) => {
    if (type !== "cmd") { return; }
    if (cmd === "stop") { await stop(); }
    else if (cmd === "restart" && (source === "BE" || source === "Arc")) { await stop(true); }
    else if (cmd === "refresh") { await refresh(source); }
});

["SIGTERM", "SIGINT", "SIGQUIT"].forEach(signal=>process.on(signal, _=>stop(false)));

process.on('uncaughtException', e => console.error(e));

