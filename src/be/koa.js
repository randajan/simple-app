import Koa from "koa";

import { std, Std, stop, restart, onRestart, onStop, Server } from "./server";
import { info } from "../info";
import { importFiles } from "../tools/importFiles";

export const app = new Koa();

export const server = new Server(app.callback(), true);

Object.defineProperty(server, "app", { value:app });

export default server;

export { Server, importFiles, info }
export const http = server.http;
export const io = server.io;

export {
    std, Std, stop, restart, 
    onStop,
    onRestart
}

server.start(...info.ports);