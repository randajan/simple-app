import { importFiles } from "../fe";
import { logger } from "../tools/logger";

const enumerable = true;
const lockObject = o=>{
    if (typeof o !== "object") { return o; }

    const r = {};
    for (const i in o) {
        const descriptor = { enumerable };
        let val = o[i];
        if (val instanceof Array) { descriptor.get = _=>[...val]; }
        else { descriptor.value = lockObject(val); }
        Object.defineProperty(r, i, descriptor);
    }

    return r;
}

export { importFiles }
export const info = lockObject(__sapp_info);
export const log = logger(info.name, info.version, info.env);

export default info;

