# Dockerfile for Mission Control (Node.js/Express Backend + Vue.js/React Frontend)

# --- Stage 1: Frontend Dependencies & Source ---
FROM node:lts-alpine AS frontend-deps

WORKDIR /app/frontend

# Copy only package.json first to leverage Docker cache for dependencies
COPY src/frontend/package.json ./

# Optionally copy package-lock.json if it exists in the build context.
# If not found, npm install will generate one in the container.
# The `|| true` ensures the build doesn't fail if package-lock.json is missing from the host.
COPY src/frontend/package-lock.json* ./package-lock.json 2>/dev/null || true

# Install all frontend dependencies.
# If package-lock.json was copied and is valid, it will be used.
# Otherwise, one will be generated based on package.json.
RUN npm install --prefer-offline --no-audit --progress=false && npm cache clean --force
# If using yarn:
# RUN yarn install --frozen-lockfile --network-concurrency 1

# Copy the rest of the frontend source code
COPY src/frontend/ ./

# --- Stage 2: Build Frontend Assets ---
# This stage inherits everything from frontend-deps (including node_modules)
FROM frontend-deps AS frontend-builder

# Build frontend static assets
# Ensure your src/frontend/package.json has a "build" script.
RUN npm run build
# This should create a 'dist' or 'build' folder in /app/frontend/ (e.g., /app/frontend/dist)


# --- Stage 3: Backend Dependencies & Source ---
FROM node:lts-alpine AS backend-deps

WORKDIR /app

# Copy only package.json first
COPY package.json ./
# Optionally copy package-lock.json if it exists.
COPY package-lock.json* ./package-lock.json 2>/dev/null || true

# Install ALL backend dependencies (including devDependencies if needed for any build steps later).
# This will generate/update package-lock.json inside this stage.
# This lock file will be copied to the production stage.
RUN npm install --prefer-offline --no-audit --progress=false && npm cache clean --force
# If using yarn:
# RUN yarn install --frozen-lockfile --network-concurrency 1

# Copy backend application code AFTER installing dependencies,
# unless backend has a build step that needs the source first.
# For a simple JS backend, this order is fine.
COPY src/backend ./src/backend
# If your backend is TypeScript, you would typically add a build step here
# or in a subsequent stage using this backend-deps stage as its base.
# Example:
# FROM backend-deps AS backend-builder
# COPY src/backend ./src/backend # Copy source again if needed for build
# RUN npm run build:backend


# --- Stage 4: Production Image ---
FROM node:lts-alpine AS production

WORKDIR /app

# Set Node environment to production
ENV NODE_ENV=production

# Use the non-root 'node' user provided by the base image
USER node

# Copy package.json AND the package-lock.json that was definitely present/generated
# in the backend-deps stage. This ensures `npm ci` uses a consistent lock file.
COPY --chown=node:node --from=backend-deps /app/package.json ./
COPY --chown=node:node --from=backend-deps /app/package-lock.json ./

# Install ONLY production backend dependencies using `npm ci` for speed and reliability.
# `npm ci` strictly requires a package-lock.json or npm-shrinkwrap.json.
RUN npm ci --omit=dev --prefer-offline --no-audit --progress=false && npm cache clean --force
# If using yarn:
# RUN yarn install --production --frozen-lockfile --network-concurrency 1

# Copy backend application code from the build context (source).
# If you had a separate backend-builder stage (e.g., for TypeScript that compiled to a 'dist_backend' folder),
# you would copy that compiled output from the backend-builder stage instead of source.
# For our current JavaScript backend, copying src/backend is fine.
COPY --chown=node:node src/backend ./src/backend

# Copy built frontend assets from frontend-builder stage to the 'public' directory
COPY --chown=node:node --from=frontend-builder /app/frontend/dist ./public
# Adjust '/app/frontend/dist' if your frontend build output directory is different (e.g., 'build').

# Expose the port the application will run on
EXPOSE 3000

# Define the healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q -O - http://localhost:3000 || exit 1
  # Alternative for Node.js if wget is not available in the base alpine image without adding it:
  # CMD node -e "require('http').get('http://localhost:3000', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Command to run the application
CMD ["node", "src/backend/server.js"]
