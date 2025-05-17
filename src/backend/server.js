// src/backend/server.js
// Script to start the HTTP server and initialize backend services

const app = require('./app'); // The Express application
const yamlService = require('./services/yamlService');
const dbService = require('./services/dbService');
const mqttService = require('./services/mqttService'); // For initializing MQTT connection

/**
 * Main function to initialize services and start the server.
 */
async function startServer() {
  try {
    // 1. Load initial settings to get the application port and other configurations
    // The yamlService handles the path to settings.yml (e.g., /app/config/settings.yml)
    const settings = await yamlService.loadSettings();
    const PORT = process.env.APP_PORT || (settings && settings.port) || 3000;

    // 2. Initialize database connection and schema
    await dbService.initialize(); // Ensures tables are created, WAL mode is set, etc.
    console.log('🗄️ Database initialized successfully.');

    // 3. Initialize MQTT Service (connect to broker based on settings)
    if (settings && settings.mqtt && settings.mqtt.broker_url && (settings.mqtt.enable !== false)) {
      try {
        // Pass the full mqtt settings object, which might include TLS/SSL options
        await mqttService.connect(settings.mqtt);
        // Success log is now handled within mqttService.connect
      } catch (mqttError) {
        console.error(`⚠️ Failed to connect to MQTT broker during startup: ${mqttError.message}`);
        // Depending on requirements, you might decide if this is a fatal error
        // or if the application can run without MQTT. For now, it just logs.
      }
    } else {
      console.log('ℹ️ MQTT broker URL not configured or MQTT is disabled in settings.yml. MQTT service not started.');
    }

    // 4. (Optional) Initialize YAML file watching for dynamic configuration reloading.
    // This should be started after initial settings are loaded.
    // Callbacks will handle reconfiguring services if necessary.
    if (yamlService.watchConfigFiles) { // Check if the method exists
        yamlService.watchConfigFiles(
          (newSettings) => { // Callback for settings.yml change
            console.log('[Server] settings.yml changed. New settings processed by yamlService.');
            // Example: Reconfigure MQTT if relevant settings changed
            if (mqttService.isConnected() && 
                (newSettings.mqtt?.broker_url !== mqttService.mqttSettings?.broker_url ||
                 newSettings.mqtt?.username !== mqttService.mqttSettings?.username)) { // Add other relevant checks
                
                console.log('[Server] MQTT settings changed, attempting to re-initialize MQTT client...');
                mqttService.disconnect(false, {}).finally(() => { // Disconnect gracefully
                    if (newSettings.mqtt?.broker_url && (newSettings.mqtt.enable !== false)) {
                        mqttService.connect(newSettings.mqtt)
                            .catch(err => console.error('[Server] Failed to reconnect MQTT on settings change:', err.message));
                    } else {
                        console.log('[Server] MQTT re-initialization skipped as new settings disable it or lack URL.');
                    }
                });
            } else if (!mqttService.isConnected() && newSettings.mqtt?.broker_url && (newSettings.mqtt.enable !== false)) {
                 console.log('[Server] MQTT was not connected, attempting to connect with new settings...');
                 mqttService.connect(newSettings.mqtt)
                    .catch(err => console.error('[Server] Failed to connect MQTT on settings change:', err.message));
            }
            // Other services might need reconfiguration based on newSettings
          },
          (newDashboardConfig) => { // Callback for dashboard.yml change
            console.log('[Server] dashboard.yml changed. New dashboard config processed by yamlService.');
            // Potentially notify frontend clients to refresh their dashboard view
            // This could be done via WebSockets or a specific MQTT message.
            // Example: mqttService.publish('mission-control/config/dashboard/updated', { timestamp: Date.now() });
          }
        );
    }


    // 5. Start the Express server
    app.listen(PORT, () => {
      console.log(`🚀 Mission Control backend server running on http://localhost:${PORT}`);
      console.log(`   Node.js version: ${process.version}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Config directory: ${yamlService.getConfigDirectory()}`);
      console.log(`   Data directory: ${dbService.DATA_DIR}`); // Assuming DATA_DIR is exported or accessible
    });

  } catch (error) {
    console.error('❌ Failed to start the Mission Control server:', error);
    process.exit(1); // Exit if critical services (like DB or initial settings load) fail
  }
}

// Start the server
startServer();

// Graceful shutdown handling (already in dbService and mqttService for their specific concerns)
// You can add more application-wide cleanup here if needed.
process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received. Shutting down...');
  // Services like dbService and mqttService have their own SIGINT/SIGTERM handlers
  // to close connections. Add any other server-specific cleanup here.
  process.exit(0); // Exit after services have had a chance to clean up.
});

process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received. Shutting down...');
  process.exit(0);
});
