import { Std } from "../tools/std";

const _beforeStop = new Set();
const _beforeRestart = new Set();

export { Std };

export const std = new Std(process.stdin, process.stdout);

export const onStop = (cb)=>{
    _beforeStop.add(cb);
    return _=>{ _beforeStop.delete(cb); }
}

export const onRestart = (cb)=>{
    _beforeRestart.add(cb);
    return _=>{ _beforeRestart.delete(cb); }
}

export const stop = async (isRestart)=>{
    const int = setTimeout(_=>process.exit(1), 3000);
    await Promise.all([..._beforeStop].map(cb=>cb(isRestart)));
    clearTimeout(int);
    process.exit(0);
}

export const restart = async (source)=>{
    await Promise.all([..._beforeRestart].map(cb=>cb(source)));
}

std.on("data", async ({ type, cmd, source }) => {
    if (type !== "cmd") { return; }
    if (cmd === "stop") { return stop(); }
    if (cmd !== "restart") { return; }

    return (source === "BE" || source === "Arc") ? stop(true) : restart(source);
});

["SIGTERM", "SIGINT", "SIGQUIT"].forEach(signal=>process.on(signal, _=>stop(false)));

process.on('uncaughtException', e => console.error(e));

