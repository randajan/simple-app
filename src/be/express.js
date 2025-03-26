import express from "express";

import { std, stop, restart, onRestart, onStop, Server } from "./server";
import { info } from "../uni/info.js";

export const app = express();
export const server = new Server(app, true);

Object.defineProperty(server, "app", { value:app });
Object.defineProperty(server, "express", { value:express });

export default server;

export const http = server.http;
export const io = server.io;

export {
    Server, express, info,
    std, stop, restart, 
    onStop,
    onRestart
}