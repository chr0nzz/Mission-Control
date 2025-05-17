// src/backend/api/serviceStatusRoutes.js (Optional)

const express = require('express');
// For a more advanced implementation, you might use 'axios' here to ping services.
// const axios = require('axios');

// This service depends on yamlService to discover configured services from widget options.
module.exports = (yamlService) => {
  const router = express.Router();

  /**
   * @route   GET /api/services/status
   * @desc    (Optional) Get an overview/status of configured self-hosted services.
   * This basic version lists services inferred from widget configurations.
   * A full implementation would involve active health checks.
   * @access  Public (local network app)
   */
  router.get('/status', async (req, res, next) => {
    try {
      const dashboardConfig = await yamlService.loadDashboardConfig(); // Gets { pageInfo, layouts, ... }
      const services = [];
      const uniqueServiceUrls = new Set(); // To avoid listing the same URL multiple times

      if (dashboardConfig.layouts && typeof dashboardConfig.layouts === 'object') {
        // Iterate over all widgets in all breakpoint layouts to find service URLs
        for (const breakpointKey in dashboardConfig.layouts) {
          if (Array.isArray(dashboardConfig.layouts[breakpointKey])) {
            dashboardConfig.layouts[breakpointKey].forEach(widget => {
              // Check for a 'url' or common service URL properties in widgetOptions
              // This inference logic might need to be more sophisticated based on widget types
              let serviceUrl = null;
              if (widget.widgetOptions) {
                if (widget.widgetOptions.url) { // Common for Sonarr, Radarr, Glances, Pi-hole, Uptime Kuma, Overseerr
                  serviceUrl = widget.widgetOptions.url;
                } else if (widget.widgetOptions.ha_url) { // Home Assistant
                  serviceUrl = widget.widgetOptions.ha_url;
                } else if (widget.widgetOptions.proxy_url) { // Docker proxy
                  // Depending on if you want to list the proxy itself or the Docker service
                  // For now, let's assume we list the proxy if it's a "service" being monitored
                  // serviceUrl = widget.widgetOptions.proxy_url;
                }
                // Add more checks for other widget types if they have uniquely named URL options
              }

              if (serviceUrl && !uniqueServiceUrls.has(serviceUrl)) {
                services.push({
                  widgetId: widget.i, // 'i' is the ID in the grid layout item
                  widgetType: widget.widgetType,
                  serviceUrl: serviceUrl,
                  inferredStatus: 'UNKNOWN', // Placeholder for actual health check result
                  // In a real implementation, you would:
                  // 1. Ping 'serviceUrl' or a known health endpoint.
                  // 2. Update 'inferredStatus' to 'UP', 'DOWN', 'UNREACHABLE', etc.
                  // 3. Potentially add response time or error messages.
                });
                uniqueServiceUrls.add(serviceUrl);
              }
            });
          }
        }
      }

      // Example of how you might perform actual health checks (conceptual):
      // for (const service of services) {
      //   try {
      //     // You'd need a more robust way to determine the actual health check endpoint.
      //     // For now, just trying to reach the base URL.
      //     const response = await axios.get(service.serviceUrl, { timeout: 3000 });
      //     // A simple 2xx/3xx status might indicate it's up, but a dedicated health endpoint is better.
      //     service.inferredStatus = (response.status >= 200 && response.status < 400) ? 'UP' : 'MAYBE_DOWN';
      //     service.statusCode = response.status;
      //   } catch (e) {
      //     service.inferredStatus = 'UNREACHABLE_OR_DOWN';
      //     service.error = e.message;
      //   }
      // }

      res.json({
        message: "Service status overview (basic implementation - lists service URLs inferred from widget configurations). Actual health checks would require further implementation.",
        discoveredServices: services
      });
    } catch (error) {
      console.error('Error getting service statuses:', error);
      next(error); // Pass to global error handler
    }
  });

  return router;
};
