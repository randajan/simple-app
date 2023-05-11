import express from "express";

import { Server } from "./index";

const server = new Server(express());

Object.defineProperty(server, "express", { value:express });

export default server;

export { express };
export const app = server.app;
export const http = server.http;
export const io = server.io;
export const bridge = server.bridge;
export const info = server.info;
