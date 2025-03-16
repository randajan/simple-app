import { EventEmitter } from "events";

const _tag = "_JSON:";



export class Std extends EventEmitter {

    constructor(streamRead, streamWrite) {
        super();

        const parseRow = (row)=>{
            if (!row.startsWith(_tag)) { return this.emit("log", row); }
            const json = row.slice(_tag.length);
            try { this.emit("data", JSON.parse(json)); }
            catch { this.emit("error", `Invalid json: ${row}`); }
        }

        let buffer = "";
        const parseRows = (data)=>{
            buffer += data.toString();
            const parts = buffer.split("\n");
            buffer = parts.pop();
        
            for (let part of parts) {
                part = part.trim();
                if (part) { parseRow(part); }
            }
        }

        streamRead.on("data", parseRows);

        streamRead.on("error", error=>this.emit("error", error));
        streamWrite.on("error", error=>this.emit("error", error));

        this.streamRead = streamRead;
        this.streamWrite = streamWrite;
    }
    async post(body) {
        const { streamWrite } = this;
        if (!streamWrite.writable) { return; }
        return new Promise((resolve, reject) => {
            if (!this.streamWrite.write(_tag+JSON.stringify(body)+"\n", "utf8", resolve)) {
                this.streamWrite.once("drain", resolve);
            }
        });
    }

}

