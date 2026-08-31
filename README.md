# Trellis

> **Interactive Concept Mapping & Document Intelligence Platform**

Trellis transforms dense, unstructured documents (everyday articles, study materials, research papers, and technical RFCs) into fluid, interactive visual concept maps and executive summaries.

---

## Architecture Overview

- **`apps/server`**: High-performance headless GraphQL Gateway built with Rust, Axum 0.7, `async-graphql` 7.0, and SQLx with DataLoader batching.
- **`apps/worker`**: Resilient asynchronous AI Extraction Worker built with TypeScript, Zod, and Vercel AI SDK (with deterministic $0 zero-cost local mock fallback).
- **`apps/web`**: Reactive visual canvas built with Angular 18 (Signals, Standalone Components), `vis-network` (force-directed physics), and `@motionone/dom`.
- **`docker/`**: Containerized PostgreSQL 16 schema and GIN indexing.

---

## Quick Start

### 1. Start Infrastructure
```bash
docker compose up -d
```

### 2. Run Backend Gateway (Rust)
```bash
npm run dev:server
```
*GraphiQL IDE available at http://localhost:8080/graphql*

### 3. Run AI Extraction Worker (TypeScript)
```bash
npm run dev:worker
```

### 4. Run Web Application (Angular 18)
```bash
npm run dev:web
```
*Web client available at http://localhost:4200*
