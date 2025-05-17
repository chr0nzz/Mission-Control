// src/backend/api/widgetDataRoutes.js

const express = require('express');

// Depends on yamlService (to get widget configs like API keys from dashboard.layouts)
// and widgetProxyService (to make external calls)
// and dbService (for caching)
module.exports = (yamlService, widgetProxyService, dbService) => {
  const router = express.Router();

  /**
   * @route   GET /api/widgets/data/:widgetId
   * @desc    Proxy data requests for a specific widget.
   * The backend fetches data from the actual service API using
   * configuration (like URL, API key) stored for that widgetId.
   * @access  Public (local network app)
   * @params  widgetId - The unique ID ('i' property from grid layout) of the widget making the request.
   * @query   Any query parameters the widget wants to pass to the target service
   * (e.g., ?metric=cpu for a Glances widget).
   * The widgetProxyService will decide how to use these.
   */
  router.get('/:widgetId', async (req, res, next) => {
    const { widgetId } = req.params;
    const clientQuery = req.query; // Query parameters from the frontend widget's request

    if (!widgetId) {
      return res.status(400).json({ message: 'Widget ID is required.' });
    }

    try {
      // 1. Check cache first
      const cachedData = await dbService.getCache(widgetId);
      if (cachedData) {
        // console.log(`[WidgetDataProxy] Cache hit for widget: ${widgetId}`);
        return res.json(cachedData);
      }
      // console.log(`[WidgetDataProxy] Cache miss for widget: ${widgetId}`);


      // 2. Find widget configuration from dashboard.yml (now from dashboardConfig.layouts)
      const dashboardConfig = await yamlService.loadDashboardConfig(); // Returns { pageInfo, layouts, ... }
      let widgetDefinition = null;

      // Helper to find widget by ID ('i') in the responsive layouts structure.
      // Widget options and type should be consistent across breakpoints,
      // so finding it in any one (e.g., 'lg' or the first available) is usually sufficient.
      function findWidgetInResponsiveLayouts(layoutsObject, id) {
        if (layoutsObject && typeof layoutsObject === 'object') {
          // Prefer 'lg' layout, then 'md', or the first breakpoint found.
          const breakpointsToTry = ['lg', 'md', 'sm', 'xs', 'xxs', ...Object.keys(layoutsObject)];
          
          for (const bp of breakpointsToTry) {
            if (layoutsObject[bp] && Array.isArray(layoutsObject[bp])) {
              const foundItem = layoutsObject[bp].find(w => w.i === id);
              if (foundItem) {
                // Return the structure expected by widgetProxyService
                return {
                  id: foundItem.i, // This is the widgetId
                  type: foundItem.widgetType,
                  options: foundItem.widgetOptions,
                  // Optionally, pass layout dimensions if proxy needs them, but usually not.
                  // w: foundItem.w,
                  // h: foundItem.h,
                };
              }
            }
          }
        }
        return null;
      }

      widgetDefinition = findWidgetInResponsiveLayouts(dashboardConfig.layouts, widgetId);

      if (!widgetDefinition) {
        return res.status(404).json({ message: `Configuration for widget ID "${widgetId}" not found in any layout.` });
      }

      // 3. Use widgetProxyService to fetch data
      // The widgetProxyService will use widgetDefinition.type and widgetDefinition.options
      // (which may contain URLs, API keys, etc.) and clientQuery.
      const data = await widgetProxyService.fetchDataForWidget(widgetDefinition, clientQuery);

      // 4. Store in cache (optional)
      // Consider TTL (time-to-live) for cache entries based on widget type or specific option in widgetDefinition.options
      const cacheTTL = widgetDefinition.options?.refresh_interval || // Use widget's refresh_interval if defined
                       widgetDefinition.options?.cacheTTL || // Or a specific cacheTTL option
                       300; // Default 5 minutes if neither is present
      await dbService.setCache(widgetId, data, cacheTTL);

      res.json(data);

    } catch (error) {
      console.error(`Error fetching data for widget ${widgetId} via API:`, error.message);
      // Pass the error to the global error handler in app.js
      // The global error handler will set the status code.
      // If error has a response (e.g., from Axios), use its status.
      const status = error.response?.status || error.status || 500;
      error.status = status; // Ensure error object has a status for the global handler
      next(error);
    }
  });

  return router;
};
