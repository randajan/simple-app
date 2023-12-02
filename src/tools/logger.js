import chalkNative from "chalk";

const chalkProps = Object.getOwnPropertyNames(Object.getPrototypeOf(chalkNative)).filter(v=>v!=="constructor");

class Logger extends Function {
    constructor(formater, chalkInit) {
        super();
        const chalk = chalkInit||chalkNative;

        const log = (...msgs)=>{ console.log(chalk(formater(msgs))); }
        const self = Object.setPrototypeOf(log.bind(), new.target.prototype);

        for (const prop of chalkProps) {
            Object.defineProperty(self, prop, { get: _=>new Logger(formater, chalk[prop]), enumerable:false });
        }
        
        return self;
    }
}

export const logger = (...prefixes)=>{
    const now = _=>(new Date()).toLocaleTimeString("cs-CZ");
    prefixes = prefixes.filter(v=>!!v).join(" ");

    return new Logger(msgs=>`${prefixes} | ${now()} | ${msgs.join(" ")}`);
}