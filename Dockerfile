# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for faster package management if needed (optional)
# RUN corepack enable

# Install dependencies first for better caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the frontend and any necessary scripts
RUN npm run build

# Production stage
FROM node:20-alpine AS runtime

# Set Node environment to production
ENV NODE_ENV=production

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy the built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy backend files and directories
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/routes ./routes || true
COPY --from=builder /app/services ./services || true
COPY --from=builder /app/middleware ./middleware || true
COPY --from=builder /app/lib ./lib || true

# Expose the application port
EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run the server
CMD ["node", "server.js"]
