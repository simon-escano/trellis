# ==========================================
# Stage 1: Build Rust GraphQL Server
# ==========================================
FROM rust:1.80-slim-bullseye AS server-builder
WORKDIR /usr/src/server

RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

# Copy cargo manifest
COPY apps/server/Cargo.toml apps/server/Cargo.lock* ./
COPY apps/server/src ./src

RUN cargo build --release

# ==========================================
# Stage 2: Build Node.js AI Worker
# ==========================================
FROM node:20-slim AS worker-builder
WORKDIR /usr/src/worker

COPY apps/worker/package*.json ./
RUN npm install

COPY apps/worker/tsconfig.json ./
COPY apps/worker/src ./src
RUN npm run build
RUN npm prune --production

# ==========================================
# Stage 3: Unified Lightweight Production Runner
# ==========================================
FROM node:20-slim AS runner
WORKDIR /app

# Install OpenSSL & CA certificates for Postgres & HTTPS
RUN apt-get update && apt-get install -y ca-certificates libssl1.1 && rm -rf /var/lib/apt/lists/*

# Copy Rust server binary
WORKDIR /app/server
COPY --from=server-builder /usr/src/server/target/release/trellis-server ./

# Copy compiled Worker
WORKDIR /app/worker
COPY --from=worker-builder /usr/src/worker/package*.json ./
COPY --from=worker-builder /usr/src/worker/node_modules ./node_modules
COPY --from=worker-builder /usr/src/worker/dist ./dist

# Copy entrypoint script
COPY docker/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

WORKDIR /app
ENV PORT=8080
EXPOSE 8080

CMD ["/app/entrypoint.sh"]
