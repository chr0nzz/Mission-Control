// src/backend/services/yamlService.js

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml'); // For parsing and stringifying YAML data
const chokidar = require('chokidar'); // For watching file changes (optional dynamic reloading)

// Define the path to the configuration directory.
// This path is inside the Docker container.
// The Dockerfile/docker-compose.yml will mount a host directory to /app/config.
const CONFIG_DIR = process.env.CONFIG_DIR || path.join('/app', 'config'); // Standardized config path
const SETTINGS_FILE_PATH = path.join(CONFIG_DIR, 'settings.yml');
const DASHBOARD_FILE_PATH = path.join(CONFIG_DIR, 'dashboard.yml');

// In-memory cache for configurations to reduce file reads
let settingsCache = null;
let dashboardConfigCache = null; // This will now store the object containing { pageInfo, layouts, ... }
let settingsTimestamp = 0;
let dashboardTimestamp = 0;

// --- Helper Functions ---

/**
 * Ensures the configuration directory exists.
 * This is particularly important on the first run if the mounted volume is empty.
 */
async function ensureConfigDirExists() {
  try {
    await fs.access(CONFIG_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`[YamlService] Configuration directory ${CONFIG_DIR} not found, creating it.`);
      await fs.mkdir(CONFIG_DIR, { recursive: true });
    } else {
      throw error; // Re-throw other errors
    }
  }
}

/**
 * Generic function to load a YAML file.
 * @param {string} filePath - The full path to the YAML file.
 * @param {object | null} cache - In-memory cache for the file content.
 * @param {number} lastReadTimestamp - Timestamp of the last cache update.
 * @param {boolean} isDashboardConfig - Flag to indicate if we are loading dashboard.yml to apply specific defaults.
 * @returns {Promise<object>} The parsed YAML content.
 * @throws {Error} If the file cannot be read or parsed.
 */
async function loadYamlFile(filePath, cache, lastReadTimestamp, isDashboardConfig = false) {
  try {
    const stats = await fs.stat(filePath);
    // Basic cache validation: if file modified time is newer than cache, reload
    if (cache && lastReadTimestamp >= stats.mtimeMs) {
      // console.log(`[YamlService] Using cache for ${path.basename(filePath)}`);
      return cache;
    }

    // console.log(`[YamlService] Reading ${path.basename(filePath)} from disk.`);
    const fileContents = await fs.readFile(filePath, 'utf8');
    const parsedConfig = yaml.load(fileContents);

    // Update cache
    if (filePath === SETTINGS_FILE_PATH) {
      settingsCache = parsedConfig;
      settingsTimestamp = stats.mtimeMs;
    } else if (filePath === DASHBOARD_FILE_PATH) {
      // The entire content of dashboard.yml is cached (e.g., { pageInfo, layouts })
      dashboardConfigCache = parsedConfig;
      dashboardTimestamp = stats.mtimeMs;
    }

    return parsedConfig;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`⚠️ Configuration file not found: ${filePath}.`);
      if (isDashboardConfig) {
        // Return a default structure for dashboard.yml if not found
        // This default should include an empty 'layouts' object for responsive grid
        console.log(`[YamlService] Returning default structure for missing ${path.basename(filePath)}`);
        return {
          pageInfo: { title: "🚀 Mission Control (Default)" },
          layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] }, // Default empty responsive layouts
        };
      }
      return {}; // For settings.yml, empty object is acceptable if not found
    }
    console.error(`❌ Error reading or parsing YAML file ${filePath}:`, error);
    throw new Error(`Failed to load configuration from ${path.basename(filePath)}: ${error.message}`);
  }
}

/**
 * Generic function to save data to a YAML file.
 * @param {string} filePath - The full path to the YAML file.
 * @param {object} data - The JavaScript object to stringify and save.
 * @throws {Error} If the file cannot be written.
 */
async function saveYamlFile(filePath, data) {
  try {
    await ensureConfigDirExists(); // Ensure directory exists before writing
    const yamlString = yaml.dump(data, { indent: 2, noRefs: true }); // noRefs helps avoid YAML anchors/aliases
    await fs.writeFile(filePath, yamlString, 'utf8');
    console.log(`💾 Configuration saved successfully to ${filePath}`);

    // Invalidate/update cache after saving
    if (filePath === SETTINGS_FILE_PATH) {
      settingsCache = data; // Update cache with the new data
      settingsTimestamp = Date.now(); // Update timestamp
    } else if (filePath === DASHBOARD_FILE_PATH) {
      dashboardConfigCache = data; // Cache the whole dashboard object
      dashboardTimestamp = Date.now();
    }
  } catch (error) {
    console.error(`❌ Error writing YAML file ${filePath}:`, error);
    throw new Error(`Failed to save configuration to ${path.basename(filePath)}: ${error.message}`);
  }
}

// --- Service Methods ---

const yamlService = {
  /**
   * Loads the settings.yml file.
   * @returns {Promise<object>} The parsed settings configuration with defaults applied.
   */
  async loadSettings() {
    const settings = await loadYamlFile(SETTINGS_FILE_PATH, settingsCache, settingsTimestamp, false);
    // Provide default values for essential settings if not present
    const defaults = {
      port: 3000,
      theme: 'dark',
      mqtt: {
        broker_url: null, // No default broker, user must specify
        client_id_prefix: "missioncontrol",
        enable: true, // Default to true if broker_url is set, but can be overridden
        // tls_enabled: false, // Default TLS options
        // reject_unauthorized: true,
      },
      logging: {
        level: "info",
      },
      // grid_layout_defaults: { // Example of how defaults for grid could be structured
      //   cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
      //   breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
      //   row_height: 30,
      //   margin: [10, 10],
      // }
    };
    // Deep merge could be used here if settings are complex. For now, simple spread.
    const mergedSettings = {
        ...defaults,
        ...settings,
        mqtt: { ...defaults.mqtt, ...(settings.mqtt || {}) },
        logging: { ...defaults.logging, ...(settings.logging || {}) },
        // grid_layout_defaults: { ...defaults.grid_layout_defaults, ...(settings.grid_layout_defaults || {})},
    };
    return mergedSettings;
  },

  /**
   * Saves the provided data to settings.yml.
   * @param {object} settingsData - The settings object to save.
   */
  async saveSettings(settingsData) {
    await saveYamlFile(SETTINGS_FILE_PATH, settingsData);
  },

  /**
   * Loads the dashboard.yml file.
   * Expects the file to contain a structure like { pageInfo: {}, layouts: { lg: [], md: [] ... } }.
   * @returns {Promise<object>} The parsed dashboard configuration with defaults applied.
   */
  async loadDashboardConfig() {
    const config = await loadYamlFile(DASHBOARD_FILE_PATH, dashboardConfigCache, dashboardTimestamp, true); // Pass true for isDashboardConfig
    
    const defaults = {
      pageInfo: { title: "🚀 Mission Control" },
      layouts: { lg: [], md: [], sm: [], xs: [], xxs: [] }, // Default empty responsive layouts
    };

    const mergedConfig = { 
        ...defaults, 
        ...config,
        // Ensure 'layouts' is an object and merge its known breakpoints with defaults
        layouts: (config && typeof config.layouts === 'object' && config.layouts !== null) 
            ? { ...defaults.layouts, ...config.layouts } 
            : defaults.layouts
    };

    // Ensure all known breakpoints (from a standard list, e.g., matching frontend) have an array
    const knownBreakpoints = ['lg', 'md', 'sm', 'xs', 'xxs']; // This list should align with DashboardView.vue
    knownBreakpoints.forEach(bp => {
        if (!mergedConfig.layouts[bp] || !Array.isArray(mergedConfig.layouts[bp])) {
            mergedConfig.layouts[bp] = []; // Initialize if missing or not an array
        }
    });
    
    // If the loaded config had an old flat 'layout' array (from pre-vue-grid-layout versions),
    // and no 'layouts' object, the frontend (DashboardView.vue) is responsible for transforming it
    // upon its first load. The backend will save it in the new 'layouts' format on the next save.
    // This service just ensures the returned object has a `layouts` property.
    if (config && config.layout && !config.layouts) { // 'layout' is Array, 'layouts' is Object
        console.warn("[YamlService] Legacy 'layout' array found in dashboard.yml and no new 'layouts' object. Frontend will handle transformation. Future saves will use the new 'layouts' object structure.");
    }

    return mergedConfig;
  },

  /**
   * Saves the provided data to dashboard.yml.
   * Expects dashboardData to be an object like { pageInfo: {}, layouts: { lg: [], md: [] ... } }.
   * @param {object} dashboardData - The dashboard configuration object to save.
   */
  async saveDashboardConfig(dashboardData) {
    if (!dashboardData || typeof dashboardData.layouts !== 'object' || dashboardData.layouts === null) {
        const errorMsg = "[YamlService] Attempted to save dashboard config without a valid 'layouts' object property. Aborting save.";
        console.error(errorMsg, dashboardData);
        throw new Error(errorMsg);
    }
    // Clean up old 'layout' property if it somehow coexists
    if (dashboardData.hasOwnProperty('layout') && Array.isArray(dashboardData.layout)) {
        delete dashboardData.layout;
    }
    await saveYamlFile(DASHBOARD_FILE_PATH, dashboardData);
  },

  /**
   * Initializes file watching for dynamic reloading.
   * @param {function} onSettingsChange - Callback when settings.yml changes. (newSettings) => void
   * @param {function} onDashboardChange - Callback when dashboard.yml changes. (newDashboardConfig) => void
   */
  watchConfigFiles(onSettingsChange, onDashboardChange) {
    console.log(`[YamlService] Watching configuration files in ${CONFIG_DIR} for changes...`);

    const watcher = chokidar.watch([SETTINGS_FILE_PATH, DASHBOARD_FILE_PATH], {
      persistent: true,
      ignoreInitial: true, // Don't fire events for existing files at startup
      awaitWriteFinish: { // Helps with atomic saves from some editors
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });

    watcher.on('change', async (filePath) => {
      console.log(`[YamlService] File changed: ${filePath}`);
      if (filePath === SETTINGS_FILE_PATH) {
        try {
          // Force reload from disk by clearing cache temporarily
          settingsCache = null; settingsTimestamp = 0;
          const newSettings = await this.loadSettings(); // Reload (and update cache)
          if (onSettingsChange && typeof onSettingsChange === 'function') {
            onSettingsChange(newSettings);
          }
          console.log('[YamlService] settings.yml reloaded due to change.');
        } catch (error) {
          console.error(`[YamlService] Error reloading settings.yml after change: ${error.message}`);
        }
      } else if (filePath === DASHBOARD_FILE_PATH) {
        try {
          // Force reload from disk
          dashboardConfigCache = null; dashboardTimestamp = 0;
          const newDashboardConfig = await this.loadDashboardConfig(); // Reload (and update cache)
          if (onDashboardChange && typeof onDashboardChange === 'function') {
            onDashboardChange(newDashboardConfig);
          }
          console.log('[YamlService] dashboard.yml reloaded due to change.');
        } catch (error) {
          console.error(`[YamlService] Error reloading dashboard.yml after change: ${error.message}`);
        }
      }
    });

    watcher.on('error', (error) => {
      console.error(`[YamlService] Watcher error: ${error}`);
    });

    // Ensure config directory exists for watcher to work properly if it's created late
    ensureConfigDirExists().catch(err => console.error("[YamlService] Error ensuring config dir for watcher:", err));
  },

  /**
   * Gets the absolute path to the configuration directory.
   * @returns {string}
   */
  getConfigDirectory() {
    return CONFIG_DIR;
  }
};

// Initialize by ensuring the config directory exists when the module is loaded.
ensureConfigDirExists().catch(err => {
  console.error("[YamlService] Initial check for config directory failed:", err);
});


module.exports = yamlService;
