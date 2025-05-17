// src/backend/app.js
// Main Express application setup

const express = require('express');
const path = require('path');
const cors = require('cors'); // For handling Cross-Origin Resource Sharing

// Import route handlers
const configRoutes = require('./api/configRoutes');
const widgetDataRoutes = require('./api/widgetDataRoutes');
const serviceStatusRoutes = require('./api/serviceStatusRoutes'); // Optional

// Import services that routes might need
// These would typically be initialized and passed if they manage state or connections,
// or route handlers could import them directly if they are stateless.
const yamlService = require('./services/yamlService');
const dbService = require('./services/dbService');
// const mqttService = require('./services/mqttService'); // mqttService is initialized in server.js
const widgetProxyService = require('./services/widgetProxyService');

const app = express();

// --- Middleware ---
// Enable CORS for all routes - adjust in production for specific origins if needed
app.use(cors());

// Body parsing middleware
// Increased limit for potentially larger dashboard configs (e.g., many widgets, responsive layouts)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// --- Static File Serving (for frontend build) ---
// This serves the built frontend application (e.g., from 'npm run build' in src/frontend)
// The Dockerfile is responsible for placing these built assets into the './public' directory
// relative to where the backend server is run.
// If backend server.js is run from /app, and public is /app/public:
app.use(express.static(path.join(__dirname, '..', '..', 'public'))); // Adjust path if your structure differs

// --- API Routes ---
// Mount the API routes.
// Pass necessary services to the route handlers.
app.use('/api/config', configRoutes(yamlService));
app.use('/api/widgets/data', widgetDataRoutes(yamlService, widgetProxyService, dbService));
app.use('/api/services', serviceStatusRoutes(yamlService)); // Optional

// --- Catch-all for Frontend Routing (for Single Page Applications) ---
// If no API routes match, serve the frontend's index.html for any other GET request.
// This allows client-side routing (e.g., Vue Router) to take over.
app.get('*', (req, res, next) => {
  // Check if the request is for an API endpoint that wasn't found by earlier routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found.' });
  }
  // Otherwise, it's likely a path for the frontend SPA, so serve index.html
  res.sendFile(path.join(__dirname, '..', '..', 'public', 'index.html'), (err) => {
    if (err) {
      // This can happen if index.html is missing or other file serving errors occur
      console.error("Error serving index.html:", err);
      res.status(500).send('Error serving frontend application.');
    }
  });
});


// --- Global Error Handling Middleware (Basic Example) ---
// This should be defined last, after all other app.use() and routes calls.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
  
  // Respond with a JSON error message
  res.status(err.status || 500).json({
    message: err.message || 'An unexpected error occurred on the server.',
    // Optionally include stack trace in development, but not in production for security
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

module.exports = app;
