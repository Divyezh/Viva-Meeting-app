
# Stage 1: Base stage with dependencies
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# Stage 2: Development stage for local containerized dev with hot reload
FROM base AS development
ENV NODE_ENV=development
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
EXPOSE 5000
CMD ["npm", "run", "dev"]

# Stage 3: Builder stage for compiling TypeScript to JavaScript
FROM base AS builder
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 4: Production runner stage (minimal footprint, production-only deps, non-root user)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled JavaScript output from builder stage
COPY --from=builder /app/dist ./dist

# Run as non-root user built into official Node Alpine image
USER node

# Expose port configured via environment variable (default 5000)
EXPOSE ${PORT}

# Start server using node
CMD ["node", "dist/server.js"]
