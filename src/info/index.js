

const enumerable = true;
const lockObject = o=>{
    const r = {};
    for (const i in o) {
        const value = (typeof o[i] === "object") ? lockObject(o[i]) : o[i];
        Object.defineProperty(r, i, {enumerable, value });
    }
    return r;
}

export default lockObject(__sapp_info);