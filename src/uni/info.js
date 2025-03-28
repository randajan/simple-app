import { defs } from "./_defs";

let slash = "/";

function getDirname() {
    const metaUrl = import.meta?.url;
    if (typeof metaUrl !== 'string') { return; }
    if (!metaUrl.startsWith('file://')) { return; }
  
    let path = decodeURIComponent(metaUrl.slice(7));
    const bs = path.startsWith('/');
    const isWin = (process.platform === 'win32' && /^\/?[A-Z]:\//i.test(path));

    if (!isWin && !bs) { return; }
    if (isWin && bs) { path = path.slice(1); }
    
    const lastSlash = path.lastIndexOf('/');
    if (lastSlash === -1) { return; }

    if (isWin) { path = path.replaceAll("/", slash = "\\"); }

    return path.slice(0, lastSlash);
}

const relativeDir = o=>{
    if (typeof o !== "object") { return o; }
    const d = o.dir;

    const cfd = getDirname();
    if (!cfd) { return o; }

    const { root, fe } = d;

    d.be = cfd;
    if (typeof root === "string") { d.root = `${cfd}${slash}${root}`; }
    if (typeof fe === "string") { d.fe = `${cfd}${slash}${fe}`; }
    
    return o;
}

export const info = relativeDir(defs?.info);
export default info;





