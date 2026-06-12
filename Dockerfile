FROM oven/bun:alpine

WORKDIR /app

# Copy package config
COPY package.json bun.lock* ./

# Install dependencies ignoring scripts for cache safety
RUN bun install --ignore-scripts

# Copy source code
COPY . .

# Set a placeholder DATABASE_URL so prisma generate doesn't crash during build time
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Run Prisma client generation
RUN bun run postinstall

# Build Next.js app, skipping environment variable validation during build time
ENV SKIP_ENV_VALIDATION=true
RUN bun run build

# Set hostname to 0.0.0.0 to allow external connections inside Docker
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

# Start the server using Bun
CMD ["bun", "run", "start"]
