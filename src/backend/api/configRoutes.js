// src/backend/api/configRoutes.js

const express = require('express');

// This function takes the yamlService as a dependency
module.exports = (yamlService) => {
  const router = express.Router();

  /**
   * @route   GET /api/config
   * @desc    Retrieve the current dashboard configuration.
   * The dashboard part will contain the `layouts` object for responsive grid.
   * @access  Public (as it's a local network app with no auth)
   */
  router.get('/', async (req, res, next) => {
    try {
      const settings = await yamlService.loadSettings();
      const dashboardConfig = await yamlService.loadDashboardConfig(); // This returns { pageInfo, layouts, ... }
      res.json({
        settings,
        dashboard: dashboardConfig, // Send the whole dashboard config object
      });
    } catch (error) {
      console.error('Error loading configuration via API:', error);
      // Pass the error to the global error handler in app.js
      next(error);
    }
  });

  /**
   * @route   POST /api/config
   * @desc    Update the dashboard or settings configuration.
   * @access  Public
   * @body    { type: "dashboard" | "settings", payload: object }
   * For "dashboard", payload is the new full dashboard object (e.g., { pageInfo, layouts: { lg: [], ... } }).
   * For "settings", payload is the new settings.yml structure.
   */
  router.post('/', async (req, res, next) => {
    const { type, payload } = req.body;

    if (!type || !payload) {
      return res.status(400).json({ message: 'Missing "type" or "payload" in request body.' });
    }

    try {
      if (type === 'dashboard') {
        // Validate that the payload for dashboard config contains the 'layouts' object
        // and that widget items have an 'i' (ID).
        if (typeof payload.layouts !== 'object' || payload.layouts === null) {
          return res.status(400).json({ message: "Invalid dashboard configuration payload: 'layouts' object is missing or not an object." });
        }
        for (const bp in payload.layouts) {
            if (Array.isArray(payload.layouts[bp])) {
                for (const item of payload.layouts[bp]) {
                    if (typeof item.i !== 'string' || !item.i) {
                         return res.status(400).json({ message: `Invalid widget item in layout for breakpoint '${bp}': missing or invalid 'i' (ID). Item: ${JSON.stringify(item)}`});
                    }
                    // Basic check for core grid properties
                    if (typeof item.x !== 'number' || typeof item.y !== 'number' || typeof item.w !== 'number' || typeof item.h !== 'number') {
                        return res.status(400).json({ message: `Invalid widget item '${item.i}' in layout for breakpoint '${bp}': missing or invalid x, y, w, or h.`});
                    }
                    if (typeof item.widgetType !== 'string' || !item.widgetType) {
                        return res.status(400).json({ message: `Invalid widget item '${item.i}' in layout for breakpoint '${bp}': missing or invalid 'widgetType'.`});
                    }
                }
            } else {
                return res.status(400).json({ message: `Invalid layout for breakpoint '${bp}': not an array.`});
            }
        }

        await yamlService.saveDashboardConfig(payload); // payload is the full dashboard object
        // It's good practice to return the state as it was saved or re-read,
        // including any defaults applied by the service on load if it was a fresh save.
        const reloadedDashboardConfig = await yamlService.loadDashboardConfig();
        res.json({ message: 'Dashboard configuration updated successfully.', dashboard: reloadedDashboardConfig });

      } else if (type === 'settings') {
        await yamlService.saveSettings(payload);
        const reloadedSettings = await yamlService.loadSettings();
        res.json({ message: 'Settings updated successfully. Some changes may require a server restart.', settings: reloadedSettings });
      } else {
        return res.status(400).json({ message: 'Invalid configuration type specified. Use "dashboard" or "settings".' });
      }
    } catch (error) {
      console.error(`Error saving ${type} configuration via API:`, error);
      next(error);
    }
  });

  return router;
};
