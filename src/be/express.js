import express from "express";

import { Server } from "./index";

export const app = express();
const server = new Server(app);

server.start();

Object.defineProperty(server, "app", { value:app });
Object.defineProperty(server, "express", { value:express });

export default server;

export { express };
export const http = server.http;
export const io = server.io;
export const info = server.info;
