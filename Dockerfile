FROM oven/bun:alpine

WORKDIR /app

# Copy package config
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Set a placeholder DATABASE_URL so prisma generate doesn't crash during build time
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Run Prisma client generation
RUN bun run postinstall

# Build Next.js app, skipping environment variable validation during build time
ENV SKIP_ENV_VALIDATION=true
RUN bun run build

EXPOSE 3000

# Start the server using Bun
CMD ["bun", "run", "start"]
