import Koa from "koa";

import { Server } from "./index";

export const app = new Koa();

const server = new Server(app.callback());

server.start();

Object.defineProperty(server, "app", { value:app });

export default server;

export const http = server.http;
export const io = server.io;
export const info = server.info;
