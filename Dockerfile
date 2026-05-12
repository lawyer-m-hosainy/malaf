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
RUN npm run build:all

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
COPY --from=builder /app/routes ./routes
COPY --from=builder /app/services ./services
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/lib ./lib

# Expose the application port
EXPOSE 3000

# Run the server
CMD ["node", "server.js"]
