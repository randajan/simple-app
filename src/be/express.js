import express from "express";

import { Server } from "./index";

export const app = express();
const server = new Server(app);

Object.defineProperty(server, "app", { value:app });
Object.defineProperty(server, "express", { value:express });

export default server;

export { express };
export const http = server.http;
export const io = server.io;
export const bridge = server.bridge;
export const info = server.info;