/* eslint-disable */
/// <reference types="bun-types" />
import { type ServerWebSocket } from "bun";

const port = process.env.WS_PORT || process.env.PORT || 3001;

interface SocketData {
  roomId?: string;
}

// Map room IDs to sets of active WebSockets
const rooms = new Map<string, Set<ServerWebSocket<SocketData>>>();

console.log(`🚀 WebSocket server starting on port ${port}...`);

Bun.serve<SocketData>({
  port: Number(port),
  fetch(req, server) {
    const success = server.upgrade(req, {
      data: {
        roomId: undefined,
      },
    });
    if (success) {
      // Bun handles the upgrade automatically
      return undefined;
    }
    return new Response("Expected WebSocket connection", { status: 400 });
  },
  websocket: {
    open(ws) {
      console.log("🟢 Client connected");
    },
    message(ws, message) {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === "join") {
          const { roomId } = data;
          if (!roomId) return;
          
          // Leave previous room if any
          if (ws.data.roomId) {
            const oldRoom = rooms.get(ws.data.roomId);
            if (oldRoom) {
              oldRoom.delete(ws);
              if (oldRoom.size === 0) rooms.delete(ws.data.roomId);
            }
          }
          
          ws.data.roomId = roomId;
          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
          }
          rooms.get(roomId)!.add(ws);
          console.log(`📥 Client joined room: ${roomId}`);
        } else if (data.type === "broadcast") {
          const roomId = ws.data.roomId || data.roomId;
          if (!roomId) return;
          
          const roomClients = rooms.get(roomId);
          if (roomClients) {
            const broadcastMsg = JSON.stringify({
              event: data.event,
              payload: data.payload
            });
            let count = 0;
            for (const client of roomClients) {
              if (client !== ws) {
                client.send(broadcastMsg);
                count++;
              }
            }
            console.log(`📤 Broadcasted event "${data.event}" in room ${roomId} to ${count} clients`);
          }
        }
      } catch (err) {
        console.error("❌ Error processing WebSocket message:", err);
      }
    },
    close(ws) {
      console.log("🔴 Client disconnected");
      if (ws.data.roomId) {
        const roomClients = rooms.get(ws.data.roomId);
        if (roomClients) {
          roomClients.delete(ws);
          if (roomClients.size === 0) {
            rooms.delete(ws.data.roomId);
          }
          console.log(`👋 Client left room: ${ws.data.roomId}`);
        }
      }
    }
  }
});
