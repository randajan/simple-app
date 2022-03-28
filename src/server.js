import express from "express";
import { createServer } from "http";
import { Server as IO } from "socket.io";


let app, http, io, listener;

export default async _=>{
    if (!listener) {
        app = express();
        http = createServer(app);
        io = new IO(http);
        
        const clients = new Set();
        const sockets = new Set();
        
        Object.defineProperty(http, "clients", {enumerable:true, get:_=>[...clients]});
        Object.defineProperty(io, "clients", {enumerable:true, get:_=>[...sockets]});
        
        http.on("connection", c=>{
            clients.add(c);
            c.on("close", _=>clients.delete(c));
        });
               
        io.on("connection", s=>{
            sockets.add(s);
            s.on("disconnect", _=>sockets.delete(s));
        });
        
        await new Promise((res, rej)=>{
            try { listener = http.listen(__sapp.port, _=>res()); } catch (e) { rej(e); }
        });
    }
    
    return { app, http, io, listener }
}

export {
    app,
    http,
    io,
    listener
}