import Koa from "koa";

import { std, stop, restart, onRestart, onStop, Server } from "./server";
import { info } from "../uni/info.js";

export const app = new Koa();

export const server = new Server(app.callback(), true);

Object.defineProperty(server, "app", { value:app });

export default server;

export const http = server.http;
export const io = server.io;

export {
    Server, info,
    std, stop, restart, 
    onStop,
    onRestart
}