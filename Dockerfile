# Dockerfile for Mission Control (Node.js/Express Backend + Vue.js/React Frontend)

# --- Stage 1: Build Frontend Assets ---
FROM node:lts-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package.json and package-lock.json.
# These files MUST exist in your src/frontend/ directory locally before building.
COPY src/frontend/package.json ./
COPY src/frontend/package-lock.json ./

# Install frontend dependencies using the lock file for consistency.
# Added flags for potentially faster/cleaner installs in CI/Docker.
RUN npm ci --prefer-offline --no-audit --progress=false && npm cache clean --force
# If using yarn:
# RUN yarn install --frozen-lockfile --network-concurrency 1

# Copy the rest of the frontend source code
# This will include tailwind.config.js, postcss.config.js if they are in src/frontend/
COPY src/frontend/ ./

# Build frontend static assets
# Ensure your src/frontend/package.json has a "build" script.
RUN npm run build
# This should create a 'dist' or 'build' folder in /app/frontend/ (e.g., /app/frontend/dist)


# --- Stage 2: Build Backend (or prepare backend dependencies) ---
FROM node:lts-alpine AS backend-builder

WORKDIR /app

# Copy backend package.json and package-lock.json.
# These files MUST exist in your project root directory locally before building.
COPY package.json ./
COPY package-lock.json ./

# Install ALL backend dependencies using the lock file.
# This includes devDependencies if needed for any backend build step (e.g., TypeScript compilation).
# If no build step for backend, `npm ci --omit=dev` could be used here too,
# but having all deps can be useful for intermediate build steps if any.
RUN npm ci --prefer-offline --no-audit --progress=false && npm cache clean --force
# If using yarn:
# RUN yarn install --frozen-lockfile --network-concurrency 1

# Copy ONLY the backend application code
COPY src/backend ./src/backend
# If your backend is TypeScript, add a build step here:
# RUN npm run build:backend # Or your specific backend build script


# --- Stage 3: Production Image ---
FROM node:lts-alpine AS production

WORKDIR /app

# Set Node environment to production
ENV NODE_ENV=production

# Use the non-root 'node' user provided by the base image
USER node

# Copy package.json AND package-lock.json from the backend-builder stage.
# Using the lock file from a previous stage ensures consistency if it was modified/generated there.
COPY --chown=node:node --from=backend-builder /app/package.json ./
COPY --chown=node:node --from=backend-builder /app/package-lock.json ./

# Install ONLY production backend dependencies using `npm ci` for speed and reliability.
RUN npm ci --omit=dev --prefer-offline --no-audit --progress=false && npm cache clean --force
# If using yarn:
# RUN yarn install --production --frozen-lockfile --network-concurrency 1

# Copy backend application code.
# If backend-builder stage performed a build (e.g., TypeScript to JS),
# you would copy the built output (e.g., from /app/dist_backend) instead of /app/src/backend.
# For our current JavaScript backend, copying src/backend is fine.
COPY --chown=node:node --from=backend-builder /app/src/backend ./src/backend

# Copy built frontend assets from frontend-builder stage to the 'public' directory
COPY --chown=node:node --from=frontend-builder /app/frontend/dist ./public
# Adjust '/app/frontend/dist' if your frontend build output directory is different.

# Expose the port the application will run on
EXPOSE 3000

# Define the healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q -O - http://localhost:3000 || exit 1
  # Alternative for Node.js if wget is not available:
  # CMD node -e "require('http').get('http://localhost:3000', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Command to run the application
CMD ["node", "src/backend/server.js"]

