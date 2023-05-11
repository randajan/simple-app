import koa from "koa";

import { Server } from "./index";

const server = new Server(koa());

Object.defineProperty(server, "koa", { value:koa });

export default server;

export { koa };
export const app = server.app;
export const http = server.http;
export const io = server.io;
export const bridge = server.bridge;
export const info = server.info;
