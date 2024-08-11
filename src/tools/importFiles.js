
export const importFiles = (files, opt={})=>{
    const prefix = String.jet.to(opt.prefix) || "./";
    const suffix = String.jet.to(opt.suffix);
    const trait = opt.trait ? opt.trait : (_=>_);

    const r = {};

    files?.filenames?.forEach((pathname, i)=>{
        if (prefix && !pathname.startsWith(prefix)) { return; }
        if (suffix && !pathname.endsWith(suffix)) { return; }
        const name = pathname.slice(prefix.length, pathname.length-suffix.length);
        const exports = files.default[i];
        r[name] = trait(exports[name] || exports.default);
    });

    return r;
}