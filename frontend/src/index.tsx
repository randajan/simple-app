import React from 'react';
import ReactDOM from 'react-dom';
import socketIOClient from "socket.io-client";
import App from './App';


const socket = socketIOClient("localhost:3000");
socket.on("reload", _=>location.reload());

ReactDOM.render(<App />, document.getElementById('root'))
