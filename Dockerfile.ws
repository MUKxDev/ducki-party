FROM oven/bun:alpine

WORKDIR /app

# Copy package descriptors first to take advantage of Docker layer caching
COPY package.json ./

# Install dependencies (only what's needed for runtime)
RUN bun install --production

# Copy the WebSocket server script
COPY src/server/ws-server.ts ./src/server/ws-server.ts

EXPOSE 3001

CMD ["bun", "run", "src/server/ws-server.ts"]
