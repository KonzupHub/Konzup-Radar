# ======================
# KONZUP RADAR - Dockerfile
# Multi-stage build for Google Cloud Run
# Includes Node.js + Python for Pytrends
# ======================

# Stage 1: Build the React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Production image with Node.js + Python
FROM node:20-alpine AS production

# Install Python 3 and pip for pytrends
RUN apk add --no-cache python3 py3-pip

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy Python requirements and install
COPY requirements-python.txt ./
RUN pip3 install --no-cache-dir --break-system-packages -r requirements-python.txt

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy server and scripts
COPY server.js ./
COPY scripts ./scripts

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port Cloud Run expects
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
