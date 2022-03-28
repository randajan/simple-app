import createApp, { root } from "./builder.js";
import server, { app, http, io } from "./server.js";

export default createApp;
export {
  root, server, app, http, io
}