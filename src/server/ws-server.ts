/* eslint-disable */
/// <reference types="bun-types" />
import { type ServerWebSocket } from "bun";

const port = process.env.WS_PORT || process.env.PORT || 3001;

interface SocketData {
  roomId?: string;
  userId?: string;
  userName?: string;
}

// Map room IDs to sets of active WebSockets
const rooms = new Map<string, Set<ServerWebSocket<SocketData>>>();

function getRoomUsers(roomId: string): { id: string; name: string }[] {
  const roomClients = rooms.get(roomId);
  if (!roomClients) return [];
  const users: { id: string; name: string }[] = [];
  const seenIds = new Set<string>();
  for (const client of roomClients) {
    const uid = client.data.userId;
    if (uid && !seenIds.has(uid)) {
      seenIds.add(uid);
      users.push({ id: uid, name: client.data.userName || "User" });
    }
  }
  return users;
}

function broadcastPresence(roomId: string) {
  const roomClients = rooms.get(roomId);
  if (!roomClients) return;
  const users = getRoomUsers(roomId);
  const msg = JSON.stringify({
    event: "PRESENCE_UPDATE",
    payload: { users },
  });
  for (const client of roomClients) {
    client.send(msg);
  }
}

console.log(`🚀 WebSocket server starting on port ${port}...`);

Bun.serve<SocketData>({
  port: Number(port),
  fetch(req, server) {
    const success = server.upgrade(req, {
      data: {
        roomId: undefined,
        userId: undefined,
        userName: undefined,
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
          const { roomId, userId, userName } = data;
          if (!roomId) return;
          
          // Leave previous room if any
          if (ws.data.roomId) {
            const oldRoomId = ws.data.roomId;
            const oldRoom = rooms.get(oldRoomId);
            if (oldRoom) {
              oldRoom.delete(ws);
              if (oldRoom.size === 0) {
                rooms.delete(oldRoomId);
              } else {
                broadcastPresence(oldRoomId);
              }
            }
          }
          
          ws.data.roomId = roomId;
          ws.data.userId = userId || undefined;
          ws.data.userName = userName || undefined;

          if (!rooms.has(roomId)) {
            rooms.set(roomId, new Set());
          }
          rooms.get(roomId)!.add(ws);
          console.log(`📥 ${userName || "Unknown"} (${userId || "?"}) joined room: ${roomId}`);

          // Broadcast updated presence to all clients in the room
          broadcastPresence(roomId);
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
        const roomId = ws.data.roomId;
        const roomClients = rooms.get(roomId);
        if (roomClients) {
          roomClients.delete(ws);
          if (roomClients.size === 0) {
            rooms.delete(roomId);
          } else {
            // Broadcast updated presence after disconnect
            broadcastPresence(roomId);
          }
          console.log(`👋 ${ws.data.userName || "Client"} left room: ${roomId}`);
        }
      }
    }
  }
});
