import express from "express";

import { Server } from "./index";
import { importFiles } from "../tools/importFiles";

export const app = express();
const server = new Server(app);



server.start();

Object.defineProperty(server, "app", { value:app });
Object.defineProperty(server, "express", { value:express });

export default server;

export { importFiles, express };
export const http = server.http;
export const io = server.io;
export const info = server.info;
