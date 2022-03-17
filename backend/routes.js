const express = require("express");
const path = require("path");

exports.default = (app, io)=>{
    app.use("/", express.static(path.join(__dirname, "../frontend/build")));
}