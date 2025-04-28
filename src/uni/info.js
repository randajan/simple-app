import { defs } from "./_defs";

function getDirname() {
    const metaUrl = import.meta?.url;
    if (typeof metaUrl !== 'string' || !metaUrl.startsWith('file://')) return;

    let path = decodeURIComponent(metaUrl.slice(7));

    // Na Windows je cesta ve formátu /C:/..., odstraníme jen to úvodní lomítko pokud tam je
    if (path[0] === '/' && /^[A-Za-z]:\//.test(path.slice(1))) {
        path = path.slice(1);
    }

    const lastSlash = path.lastIndexOf('/');
    if (lastSlash === -1) { return; }

    return path.slice(0, lastSlash);
}

const relativeDir = o=>{
    if (typeof o !== "object") { return o; }
    const d = o.dir;
    if (typeof d !== "object") { return o; }

    let cfd = getDirname();
    if (!cfd) { try { cfd = __dirname; } catch { return o; } }

    const { root, fe } = d;

    d.be = cfd;
    if (typeof root === "string") { d.root = `${cfd}/${root}`; }
    if (typeof fe === "string") { d.fe = `${cfd}/${fe}`; }
    
    return o;
}

export const info = relativeDir(defs?.info);
export default info;





