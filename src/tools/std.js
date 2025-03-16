import { EventEmitter } from "events";

const _tag = "$JSON";

export class Std extends EventEmitter {

    constructor(streamRead, streamWrite) {
        super();

        streamRead.on("data", (data) => {
            const text = data.toString().trim();
            try {
                const [tag, body] = JSON.parse(text);
                if (tag === _tag) { return this.emit("data", body); }
            } catch { }
            this.emit("log", text); 
        });

        this.streamRead = streamRead;
        this.streamWrite = streamWrite;
    }

    async post(body) {
        return new Promise((resolve, reject) => {
            if (!this.streamWrite.write(JSON.stringify([_tag, body]), "utf8", resolve)) {
                this.streamWrite.once("drain", resolve);
            }
        });
    }

}

