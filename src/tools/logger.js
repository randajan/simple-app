import chalkNative from "chalk";

const loggerFactory = (formater, chalkInstance = chalkNative) => {
    return new Proxy(
        (...msgs) => console.log(chalkInstance(formater(msgs))), 
        {
            get: (_, prop) => (prop in chalkInstance ? loggerFactory(formater, chalkInstance[prop]) : undefined)
        }
    );
}

export const createLogger = formater=>loggerFactory(formater);

export const mainLogger = (...prefixes)=>{
    const now = _=>(new Date()).toLocaleTimeString();
    prefixes = prefixes.filter(v=>!!v).join(" ");

    return createLogger(msgs=>`${prefixes} | ${now()} | ${msgs.join(" ")}`);
}