import Koa from "koa";

import { Server } from "./index";
import { info } from "../info";
import { importFiles } from "../tools/importFiles";

export const app = new Koa();

export const server = new Server(app.callback(), true);

Object.defineProperty(server, "app", { value:app });

export default server;

export { Server, importFiles, info }
export const http = server.http;
export const io = server.io;


server.start(...info.ports);