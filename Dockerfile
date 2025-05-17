# Dockerfile for Mission Control (Node.js/Express Backend + Vue.js/React Frontend)

# --- Stage 1: Build Frontend Assets ---
FROM node:lts-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy frontend package.json and package-lock.json (or yarn.lock)
COPY src/frontend/package.json ./

# If using yarn:
# COPY src/frontend/yarn.lock ./

# Install frontend dependencies
RUN npm install
# If using yarn:
# RUN yarn install --frozen-lockfile

# Copy the rest of the frontend source code
COPY src/frontend/ ./

# Build frontend static assets
# Replace 'npm run build' with your actual frontend build command (e.g., vue-cli-service build, react-scripts build)
RUN npm run build
# This should create a 'dist' or 'build' folder in /app/frontend/ (e.g., /app/frontend/dist)


# --- Stage 2: Build Backend ---
FROM node:lts-alpine AS backend-builder

WORKDIR /app

# Copy backend package.json and package-lock.json (or yarn.lock)
# Assuming backend and frontend have separate package.json or a root one.
# For this example, assuming backend dependencies are managed by a root package.json
# If backend has its own package.json at src/backend/package.json, adjust paths.
COPY package.json ./
RUN npm install
# If using yarn:
# COPY yarn.lock ./

# Install ALL dependencies (including devDependencies if backend needs them for build, e.g., TypeScript)
# If backend is TypeScript, you'd transpile here.
# For a pure JavaScript backend, you might only need production dependencies later.
RUN npm install
# If using yarn:
# RUN yarn install --frozen-lockfile

# Copy the entire src directory (backend and frontend for context, though frontend is already built)
# Alternatively, just copy src/backend if backend is self-contained for its build.
COPY src ./src
COPY src/frontend/tailwind.config.js ./ # If Tailwind is processed by backend or part of a shared build

# If your backend is TypeScript, add a build step here:
# RUN npm run build:backend # Or your specific backend build script

# --- Stage 3: Production Image ---
FROM node:lts-alpine AS production

WORKDIR /app

# Set Node environment to production
ENV NODE_ENV=production

# Create a non-root user and group
# Using 'node' user which is conventional in node base images, but often has UID 1000.
# If your base image doesn't have 'node' user, you'd use:
# RUN addgroup -S appgroup && adduser -S -G appgroup appuser
# USER appuser
# For node:lts-alpine, 'node' user exists. We'll use it.
# Ensure /app directory is owned by the node user for writing logs or temp files if needed.
# The 'node' user in official images usually has UID 1000.
# RUN chown -R node:node /app # Usually not needed if WORKDIR is /app and USER is node

# Copy necessary files from backend-builder stage
COPY --from=backend-builder /app/package.json ./
COPY --from=backend-builder /app/package-lock.json ./
# If using yarn:
# COPY --from=backend-builder /app/yarn.lock ./

# Install ONLY production backend dependencies
RUN npm ci --omit=dev
# If using yarn:
# RUN yarn install --production --frozen-lockfile

# Copy backend application code from backend-builder stage
# This includes the compiled backend code if it was a TypeScript project
COPY --from=backend-builder /app/src/backend ./src/backend
# If you have other top-level files needed by backend (e.g. main config loader), copy them too.
# COPY --from=backend-builder /app/some_other_file.js ./

# Copy built frontend assets from frontend-builder stage to the 'public' directory
# This 'public' directory will be served by Express static middleware.
COPY --from=frontend-builder /app/frontend/dist ./public
# Adjust '/app/frontend/dist' if your frontend build output directory is different.

# Expose the port the application will run on (defined in settings.yml or ENV)
# This is for documentation; actual port mapping is done in docker-compose.yml
# The default port is 3000, but it can be changed via settings.yml
EXPOSE 3000

# Define the healthcheck
# This is a basic healthcheck; adjust the path and conditions as needed.
# It assumes your app has a simple health endpoint or that serving the main page indicates health.
# For a real app, you might want a dedicated /api/health endpoint in your backend.
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q -O - http://localhost:3000 || exit 1
  # Or use: CMD ["node", "-e", "require('http').get('http://localhost:3000', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]


# Switch to the non-root user before running the application
USER node

# Command to run the application
# This should start your backend server (e.g., src/backend/server.js)
CMD ["node", "src/backend/server.js"]
