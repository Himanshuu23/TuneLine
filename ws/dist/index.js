"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const app = (0, express_1.default)();
const httpServer = app.listen(process.env.PORT, () => {
    console.log("Server Started at PORT:11011");
});
const wss = new ws_1.WebSocketServer({ server: httpServer });
wss.on("connection", (socket) => {
    console.log("WebSocket Connection established!");
    socket.on("error", console.error);
    socket.on("message", (data) => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    });
});
