import { fillObj } from "../tools/uni";

export const argv = {};
export default argv;

const _trues = /^true$/i;
const _falses = /^false$/i;


const parseValue = raw => {
    raw = raw.trim();

    if (_trues.test(raw)) { return true; }
    if (_falses.test(raw)) { return false; }


    if (raw.startsWith("[") && raw.endsWith("]")) {
        return raw.slice(1, -1).split(",").map(parseValue);
    }

    const num = Number(raw);
    if (!isNaN(num)) { return num; }

    return raw;
}

for (const arg of process.argv) {
    const pair = String(arg).split("=");
    if (pair.length <= 1) { continue; }
    const key = pair.shift();
    if (!key) { continue; }

    fillObj(argv, key, parseValue(pair.join("")));
}

Object.freeze(argv);