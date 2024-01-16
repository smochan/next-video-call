// import express from "express";
// import http from "http";
// import { Server } from "socket.io";
// import {ExpressPeerServer} from "@peer/express";

// const app = express();
// const server = http.createServer();
// const io = new Server(server, {
//     cors: {
//         origin: "*",
//     }
// });

// const peerServer = ExpressPeerServer(server, {
//     debug: true,
// });

// app.use("/peerjs", peerServer);

// import http from "http";
// import { Server } from "socket.io";
// import { createServer } from "http";

// const httpServer = createServer();

// const io = new Server(httpServer, {
//   cors: {
//     origin: "*",
//   },
// });



//              <--------------------------------------------->



// const server = require('http').createServer();
// const io = require('socket.io')(server);

// io.on("connection", (socket: any) => {
//   const roomId = socket.handshake.query.roomId;
//   const userId = socket.handshake.query.userId;

//   socket.on("join-room", (roomId: string, userId: string) => {
//     socket.join(roomId);
//     io.to(roomId).emit("user-connected", userId);
//   });

//   socket.on("disconnect", () => {
//   //  socket.join(roomId);
//   io.to(roomId).emit("user-disconnected", userId);
//   console.log("user disconnected");
//   });
// });

// const PORT = 8080;

// server.listen(PORT, () => {
//   console.log(`Server listening on port ${PORT}`);
// });

            // <--------------------------------------------->

const PORT = 8080; 
import type { Server as HTTPServer } from "http"
import type { Socket as NetSocket } from "net"
import type { NextApiRequest, NextApiResponse } from "next"
import type { Server as IOServer } from "socket.io"
import { Server } from "socket.io"

export const config = {
  api: {
    bodyParser: false,
  },
}

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}
export default function SocketHandler(_req: NextApiRequest, res: NextApiResponseWithSocket) {
  res.setHeader('Access-Control-Allow-Origin', 'https://next-video-call-umber.vercel.app');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  if (res.socket.server.io) {
    res.status(200).json({ success: true, message: "Socket is already running", socket: `:${PORT + 1}` })
    return
  }

  console.log("Starting Socket.IO server on port:", PORT + 1)

  const io = new Server({ path: "/api/socket", addTrailingSlash: false, 
  cors: {
    origin: "https://localhost:3000",
    methods: ["GET", "POST"] } 
  }).listen(PORT + 1)

  io.on("connect", socket => {
    // const _socket = socket
    console.log("socket connected")

    // const roomId = socket.handshake.query.roomId;
    // const userId = socket.handshake.query.userId;
    // console.log("socket.handshake", socket.handshake)

    // console.log("join-room", roomId, userId)
    socket.on("join-room", (data) => {
      console.log("join-room", data);
      socket.join(data.roomId);
      io.to(data.roomId).emit("user-connected", data);
    });
    socket.on("message", (data) => {
      console.log("message", data.message, data.roomId, data.userId);
      io.to(data.roomId).emit("new-message", data);
    });

    socket.on("camera-off", (data) => {
      console.log("camera-off", data);
      io.to(data.roomId).emit("camera-off", data);
    });
    // _socket.broadcast.emit("welcome", `Welcome ${_socket.id}`)
    socket.on("disconnect", async () => {
      console.log("socket disconnect")
    })
  })

  res.socket.server.io = io
  res.status(201).json({ success: true, message: "Socket is started", socket: `:${PORT + 1}` })
}