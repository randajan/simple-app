const argv = {};

const _trues = ["y", "t", "true"];
const _falses = ["n", "f", "false"];

const parseValue = raw=>{
  const low = raw.toLowerCase();
  if (_trues.includes(low)) { return true; }
  if (_falses.includes(low)) { return false; }

  const num = Number(raw);
  if (!isNaN(num)) { return num; }

  return raw;
}

for (const arg of process.argv ) {
  const pair = String(arg).split("=");
  if (pair.length <= 1) { continue; }
  const key = pair.shift();
  if (!key) { continue; }

  Object.defineProperty(argv, key, {value:parseValue(pair.join("")), enumerable:true});
}

export default argv;