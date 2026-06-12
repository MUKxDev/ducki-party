FROM oven/bun:alpine

WORKDIR /app

# Copy package config
COPY package.json bun.lockb* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Run Prisma client generation
RUN bun run postinstall

# Build Next.js app, skipping environment variable validation during build time
ENV SKIP_ENV_VALIDATION=true
RUN bun run build

EXPOSE 3000

# Start the server using Bun
CMD ["bun", "run", "start"]
