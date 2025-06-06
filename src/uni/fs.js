
export const importFiles = (files, opt={})=>{
    const prefix = opt.prefix || "./";
    const suffix = opt.suffix || "";
    const trait = opt.trait ? opt.trait : ((ex, nm)=>ex[nm] || ex.default);

    const r = {};

    files?.filenames?.forEach((pathname, i)=>{
        if (prefix && !pathname.startsWith(prefix)) { return; }
        if (suffix && !pathname.endsWith(suffix)) { return; }
        const name = pathname.slice(prefix.length, pathname.length-suffix.length);
        const exports = files.default[i];
        r[name] = trait(exports, name);
    });

    return r;
}

export default importFiles;