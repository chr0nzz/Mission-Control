// src/backend/services/dbService.js

const sqlite3 = require('sqlite3').verbose(); // Use verbose for more detailed stack traces
const path = require('path');
const fs = require('fs').promises;

// Define the path to the data directory and database file.
// These paths are inside the Docker container.
const DATA_DIR = process.env.DATA_DIR || path.join('/app', 'data');
const DB_FILE_PATH = path.join(DATA_DIR, 'mission_control.db');

let db = null; // To hold the database connection instance

/**
 * Ensures the data directory exists.
 */
async function ensureDataDirExists() {
  try {
    await fs.access(DATA_DIR);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`[DBService] Data directory ${DATA_DIR} not found, creating it.`);
      await fs.mkdir(DATA_DIR, { recursive: true });
    } else {
      throw error;
    }
  }
}

/**
 * Promisify common database operations.
 */
const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) { // Check if db is initialized
        reject(new Error("Database not initialized. Cannot run query."));
        return;
    }
    db.run(query, params, function (err) { // Use 'function' to access 'this.lastID', 'this.changes'
      if (err) {
        console.error('DB Run Error:', query, params, err.message);
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
        reject(new Error("Database not initialized. Cannot get query."));
        return;
    }
    db.get(query, params, (err, row) => {
      if (err) {
        console.error('DB Get Error:', query, params, err.message);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
        reject(new Error("Database not initialized. Cannot run all query."));
        return;
    }
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('DB All Error:', query, params, err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const dbService = {
  // Expose DATA_DIR for server.js logging if needed
  DATA_DIR: DATA_DIR,

  /**
   * Initializes the database connection and creates tables if they don't exist.
   * @returns {Promise<void>}
   */
  async initialize() {
    if (db) {
      console.log('[DBService] Database already initialized.');
      return;
    }

    try {
      await ensureDataDirExists();

      // Open the database connection
      // The actual connection happens here.
      await new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_FILE_PATH, (err) => {
          if (err) {
            console.error('❌ Failed to connect to SQLite database:', err.message);
            db = null; // Ensure db is null on failure
            reject(err); // Reject the promise
          } else {
            console.log(`🗄️ Connected to SQLite database: ${DB_FILE_PATH}`);
            resolve(); // Resolve the promise
          }
        });
      });
      
      if (!db) { // Double check if db connection failed silently (should be caught by reject above)
          throw new Error("Database connection object (db) is null after attempting to connect.");
      }

      // Enable WAL (Write-Ahead Logging) mode for better performance and concurrency.
      await dbRun('PRAGMA journal_mode = WAL;');
      console.log('[DBService] SQLite WAL mode enabled.');

      // Create tables
      await this.createTables();

      // Periodically clean up expired cache entries
      this.startCacheCleanup();

    } catch (error) {
      console.error('❌ Error initializing database:', error);
      db = null; // Ensure db is null on any initialization error
      throw error; // Propagate error to stop server if DB init fails
    }
  },

  /**
   * Creates the necessary database tables if they don't already exist.
   */
  async createTables() {
    const createCacheTableQuery = `
      CREATE TABLE IF NOT EXISTS widget_cache (
        widget_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        expires_at INTEGER NOT NULL -- Store as Unix timestamp (seconds)
      );
    `;
    await dbRun(createCacheTableQuery);
    console.log('[DBService] Table "widget_cache" checked/created.');

    const createWidgetLayoutsTableQuery = `
      CREATE TABLE IF NOT EXISTS widget_layouts (
        widget_id TEXT PRIMARY KEY, -- Corresponds to the ID in dashboard.yml
        layout_info TEXT NOT NULL,   -- JSON string containing position, size, etc. for various breakpoints
        last_modified INTEGER NOT NULL -- Unix timestamp
      );
    `;
    // This table is for storing UI-driven layout changes if not immediately persisted to YAML.
    // Or for storing user preferences about layout that are not in YAML.
    await dbRun(createWidgetLayoutsTableQuery);
    console.log('[DBService] Table "widget_layouts" checked/created.');

    // Add more tables as needed (e.g., for historical data, user preferences)
  },

  /**
   * Caches data for a specific widget.
   * @param {string} widgetId - The unique ID of the widget.
   * @param {any} data - The data to cache (will be JSON.stringified).
   * @param {number} ttlSeconds - Time-to-live for the cache entry in seconds.
   */
  async setCache(widgetId, data, ttlSeconds = 300) { // Default TTL 5 minutes
    if (!db) {
        console.error("[DBService] Database not initialized. Cannot set cache.");
        return; // Or throw new Error("Database not initialized. Call initialize() first.");
    }
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    const jsonData = JSON.stringify(data);
    const query = `
      INSERT OR REPLACE INTO widget_cache (widget_id, data, expires_at)
      VALUES (?, ?, ?);
    `;
    try {
      await dbRun(query, [widgetId, jsonData, expiresAt]);
      // console.log(`[DBService] Cached data for widget: ${widgetId}, expires in ${ttlSeconds}s`);
    } catch (error) {
      console.error(`[DBService] Error setting cache for widget ${widgetId}:`, error);
    }
  },

  /**
   * Retrieves cached data for a specific widget if not expired.
   * @param {string} widgetId - The unique ID of the widget.
   * @returns {Promise<any | null>} The parsed cached data, or null if not found or expired.
   */
  async getCache(widgetId) {
    if (!db) {
        console.error("[DBService] Database not initialized. Cannot get cache.");
        return null; // Or throw new Error("Database not initialized. Call initialize() first.");
    }
    const query = `
      SELECT data, expires_at FROM widget_cache
      WHERE widget_id = ?;
    `;
    try {
      const row = await dbGet(query, [widgetId]);
      if (row) {
        const now = Math.floor(Date.now() / 1000);
        if (row.expires_at > now) {
          return JSON.parse(row.data);
        } else {
          // console.log(`[DBService] Cache expired for widget: ${widgetId}. Deleting.`);
          await this.deleteCache(widgetId); // Await deletion
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error(`[DBService] Error getting cache for widget ${widgetId}:`, error);
      return null;
    }
  },

  /**
   * Deletes a specific cache entry.
   * @param {string} widgetId - The unique ID of the widget whose cache to delete.
   */
  async deleteCache(widgetId) {
    if (!db) {
        console.error("[DBService] Database not initialized. Cannot delete cache.");
        return; // Or throw new Error("Database not initialized. Call initialize() first.");
    }
    const query = `DELETE FROM widget_cache WHERE widget_id = ?;`;
    try {
      await dbRun(query, [widgetId]);
    } catch (error) {
      console.error(`[DBService] Error deleting cache for widget ${widgetId}:`, error);
    }
  },

  /**
   * Cleans up all expired cache entries from the database.
   */
  async cleanupExpiredCache() {
    if (!db) {
      // console.warn("[DBService] DB not ready for cache cleanup.");
      return;
    }
    const now = Math.floor(Date.now() / 1000);
    const query = `DELETE FROM widget_cache WHERE expires_at <= ?;`;
    try {
      const result = await dbRun(query, [now]);
      if (result.changes > 0) {
        console.log(`[DBService] Cleaned up ${result.changes} expired cache entries.`);
      }
    } catch (error) {
      console.error('[DBService] Error cleaning up expired cache:', error);
    }
  },

  /**
   * Starts a periodic task to clean up expired cache.
   * @param {number} intervalMs - How often to run the cleanup in milliseconds.
   */
  startCacheCleanup(intervalMs = 60 * 60 * 1000) { // Default: every 1 hour
    console.log(`[DBService] Cache cleanup task scheduled to run every ${intervalMs / 1000 / 60} minutes.`);
    // Run once initially after a short delay, ensure DB is ready
    setTimeout(() => {
        if(db) this.cleanupExpiredCache();
    }, 5000);
    // Then run periodically
    setInterval(() => {
        if(db) this.cleanupExpiredCache();
    }, intervalMs);
  },

  /**
   * Saves or updates the layout information for a specific widget.
   * (Conceptual: for storing UI-driven layout that might not be in YAML)
   * @param {string} widgetId - The unique ID of the widget.
   * @param {object} layoutInfo - An object containing layout details (e.g., { x, y, w, h }).
   */
  async saveWidgetLayout(widgetId, layoutInfo) {
    if (!db) {
        console.error("[DBService] Database not initialized. Cannot save widget layout.");
        return;
    }
    const jsonLayoutInfo = JSON.stringify(layoutInfo);
    const lastModified = Math.floor(Date.now() / 1000);
    const query = `
      INSERT OR REPLACE INTO widget_layouts (widget_id, layout_info, last_modified)
      VALUES (?, ?, ?);
    `;
    await dbRun(query, [widgetId, jsonLayoutInfo, lastModified]);
    console.log(`[DBService] Saved layout for widget: ${widgetId}`);
  },

  /**
   * Retrieves the layout information for a specific widget.
   * @param {string} widgetId - The unique ID of the widget.
   * @returns {Promise<object | null>} The parsed layout information or null if not found.
   */
  async getWidgetLayout(widgetId) {
    if (!db) {
        console.error("[DBService] Database not initialized. Cannot get widget layout.");
        return null;
    }
    const row = await dbGet(`SELECT layout_info FROM widget_layouts WHERE widget_id = ?;`, [widgetId]);
    return row ? JSON.parse(row.layout_info) : null;
  },

  /**
   * Retrieves all stored widget layouts.
   * @returns {Promise<Array<{widget_id: string, layout_info: object}>>}
   */
  async getAllWidgetLayouts() {
    if (!db) {
        console.error("[DBService] Database not initialized. Cannot get all widget layouts.");
        return [];
    }
    const rows = await dbAll(`SELECT widget_id, layout_info FROM widget_layouts;`);
    return rows.map(row => ({
      widget_id: row.widget_id,
      layout_info: JSON.parse(row.layout_info)
    }));
  },

  /**
   * Closes the database connection.
   * @returns {Promise<void>}
   */
  async close() {
    return new Promise((resolve, reject) => {
      if (db) {
        console.log('[DBService] Attempting to close database connection...');
        db.close((err) => {
          if (err) {
            console.error('❌ Error closing the database connection:', err.message);
            reject(err);
          } else {
            console.log('🗄️ Database connection closed.');
            db = null; // Nullify the db instance
            resolve();
          }
        });
      } else {
        console.log('[DBService] No active database connection to close.');
        resolve(); // No connection to close
      }
    });
  }
};

// Graceful shutdown: Ensure DB connection is closed when the app exits
// These handlers are registered once when the module is loaded.
let shuttingDown = false;
async function gracefulShutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[DBService] ${signal} received. Closing database connection...`);
    try {
        await dbService.close();
    } catch (e) {
        console.error("[DBService] Error during graceful shutdown:", e.message);
    } finally {
        process.exit(signal === 'SIGINT' ? 0 : 1); // Exit with 0 for SIGINT, or original signal code
    }
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = dbService;
