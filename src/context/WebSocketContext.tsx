/* eslint-disable */
import React, { createContext, useContext, useEffect, useRef, useState } from "react";

export interface PresenceUser {
  id: string;
  name: string;
}

interface WebSocketContextType {
  sendBroadcast: (event: string, payload: any) => void;
  subscribe: (event: string, callback: (payload: any) => void) => () => void;
  isConnected: boolean;
  connectedUsers: PresenceUser[];
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};

export const useOptionalWebSocket = () => {
  return useContext(WebSocketContext);
};

interface WebSocketProviderProps {
  roomId: string;
  userId?: string;
  userName?: string;
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ roomId, userId, userName, children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState<PresenceUser[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Map<string, Set<(payload: any) => void>>>(new Map());

  useEffect(() => {
    if (!roomId) return;

    let socketUrl: string;
    if (process.env.NEXT_PUBLIC_WS_URL) {
      socketUrl = process.env.NEXT_PUBLIC_WS_URL;
    } else {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const hostname = window.location.hostname;
      if (hostname === "party.mukxdev.com") {
        socketUrl = "wss://party-ws.mukxdev.com";
      } else {
        // Default to localhost:3001 or current host if self-hosted
        socketUrl = `${protocol}//${hostname}:3001`;
      }
    }

    let reconnectTimeout: NodeJS.Timeout;
    let isCleanUp = false;

    const connect = () => {
      console.log(`Connecting to WebSocket: ${socketUrl}`);
      const ws = new WebSocket(socketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected successfully!");
        setIsConnected(true);
        // Join the current room with user info
        ws.send(JSON.stringify({ type: "join", roomId, userId, userName }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { event: eventName, payload } = data;

          // Handle presence updates internally
          if (eventName === "PRESENCE_UPDATE") {
            const users = (payload as { users: PresenceUser[] })?.users;
            if (users) {
              setConnectedUsers(users);
            }
            return;
          }

          if (eventName) {
            const callbacks = listenersRef.current.get(eventName);
            if (callbacks) {
              callbacks.forEach((cb) => cb(payload));
            }
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed.");
        setIsConnected(false);
        if (!isCleanUp) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket connection error:", error);
      };
    };

    connect();

    return () => {
      isCleanUp = true;
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [roomId, userId, userName]);

  const sendBroadcast = (event: string, payload: any) => {
    // Trigger local subscribers in the same client for immediate feedback
    const callbacks = listenersRef.current.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(payload));
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "broadcast",
          roomId,
          event,
          payload,
        })
      );
    } else {
      console.warn("WebSocket is not connected. Broadcast not sent.");
    }
  };

  const subscribe = (event: string, callback: (payload: any) => void) => {
    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, new Set());
    }
    listenersRef.current.get(event)!.add(callback);

    return () => {
      const callbacks = listenersRef.current.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          listenersRef.current.delete(event);
        }
      }
    };
  };

  return (
    <WebSocketContext.Provider value={{ sendBroadcast, subscribe, isConnected, connectedUsers }}>
      {children}
    </WebSocketContext.Provider>
  );
};
