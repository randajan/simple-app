import express from "express";

import { Server } from "./index";
import { info } from "../info";
import { importFiles } from "../tools/importFiles";

export const app = express();
export const server = new Server(app, true);

Object.defineProperty(server, "app", { value:app });
Object.defineProperty(server, "express", { value:express });

export default server;

export { Server, importFiles, express, info };
export const http = server.http;
export const io = server.io;


server.start(...info.ports);