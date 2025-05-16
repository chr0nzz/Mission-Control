const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const ConfigurationService = require('./services/ConfigurationService'); // Import the ConfigurationService
const ApiProxyService = require('./services/ApiProxyService'); // Import the ApiProxyService
const WidgetService = require('./services/WidgetService'); // Import the WidgetService
const WidgetManagementService = require('./services/WidgetManagementService');
const UserService = require('./services/UserService'); // Import the UserService
const DashboardService = require('./services/DashboardService'); // Import the DashboardService

const app = express();
const port = process.env.BACKEND_PORT || 55726;

// Middleware to parse JSON request bodies
app.use(express.json());

// Define the path to the SQLite database file
// This should ideally be mounted as a Docker volume for persistence
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'missioncontrol.db');

let db; // Variable to hold the database connection

// Function to initialize the database and create tables if they don't exist
async function initDatabase() {
  return new Promise((resolve, reject) => {
    // Open the database connection
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
      } else {
        console.log('Connected to the SQLite database.');

        // Enable foreign key constraints
        db.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
          if (pragmaErr) {
            console.error('Error enabling foreign keys:', pragmaErr.message);
            reject(pragmaErr);
          } else {
            console.log('Foreign key constraints enabled.');

            // SQL statements to create tables based on readme.md schema
            const createTablesSql = `
              CREATE TABLE IF NOT EXISTS Users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                preferences_json TEXT
              );

              CREATE TABLE IF NOT EXISTS Dashboards (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES Users(id)
              );

              CREATE TABLE IF NOT EXISTS WidgetTypes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                is_custom BOOLEAN NOT NULL DEFAULT 0,
                source_identifier TEXT,
                icon_identifier TEXT
              );

              CREATE TABLE IF NOT EXISTS Widgets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                dashboard_id INTEGER NOT NULL,
                widget_type_id INTEGER NOT NULL,
                config_json TEXT,
                position_x INTEGER NOT NULL,
                position_y INTEGER NOT NULL,
                width INTEGER NOT NULL,
                height INTEGER NOT NULL,
                FOREIGN KEY (dashboard_id) REFERENCES Dashboards(id),
                FOREIGN KEY (widget_type_id) REFERENCES WidgetTypes(id)
              );

              CREATE TABLE IF NOT EXISTS AppSettings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                setting_key TEXT UNIQUE NOT NULL,
                setting_value TEXT,
                service_type TEXT,
                service_instance_id TEXT
              );
            `;

            // Run the table creation SQL
            db.exec(createTablesSql, (execErr) => {
              if (execErr) {
                console.error('Error creating tables:', execErr.message);
                reject(execErr);
              } else {
                console.log('Database tables checked/created successfully.');
                resolve();
              }
            });
          }
        });
      }
    });
  });
}

// Initialize the database before starting the server
initDatabase()
  .then(() => {
    // TODO: Implement loading initial configuration from YAML if needed here
    // (Based on readme, YAML is more for static app config, SQLite for user/widget config)
// Initialize services
const configurationService = new ConfigurationService();
const apiProxyService = new ApiProxyService();
const widgetManagementService = new WidgetManagementService();
const MqttService = require('./services/MqttService');
const BackupRestoreService = require('./services/BackupRestoreService');
const backupRestoreService = new BackupRestoreService();
const mqttService = new MqttService();

mqttService.connect()
  .then(() => console.log('MQTT service connected'))
  .catch(err => console.error('Failed to connect to MQTT:', err));

    // --- Backend API Routes ---

    // Basic root route
    app.get('/', (req, res) => {
      res.send('Mission Control Backend is running!');
    });

    // Settings API routes
    // TODO: Implement authentication and authorization for these routes
    app.post('/api/settings', async (req, res) => {
      const { key, value, serviceType, serviceInstanceId } = req.body;
      if (!key || value === undefined) {
        return res.status(400).json({ error: 'Missing required parameters: key, value' });
      }
      try {
        await ConfigurationService.saveSetting(key, value, serviceType, serviceInstanceId);
        res.status(200).json({ message: 'Setting saved successfully.' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to save setting', details: error.message });
      }
    });

    app.get('/api/settings/:key', async (req, res) => {
      const { key } = req.params;
      try {
        const value = await ConfigurationService.getSetting(key);
        if (value !== null) {
          res.status(200).json({ key, value });
        } else {
          res.status(404).json({ error: 'Setting not found' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve setting', details: error.message });
      }
    });

     app.get('/api/settings', async (req, res) => {
        const { serviceType, serviceInstanceId } = req.query;
         try {
             const settings = await ConfigurationService.getAllSettings(serviceType, serviceInstanceId);
             res.status(200).json(settings);
         } catch (error) {
             res.status(500).json({ error: 'Failed to retrieve settings', details: error.message });
         }
     });

    app.delete('/api/settings/:key', async (req, res) => {
        const { key } = req.params;
        try {
            await ConfigurationService.deleteSetting(key);
            res.status(200).json({ message: `Setting "${key}" deleted successfully.` });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete setting', details: error.message });
        }
    });

    // API Proxy route for widgets to access external services
    // TODO: Implement authentication and authorization for this route
    app.post('/api/proxy', async (req, res) => {
        const { serviceType, serviceInstanceId, method, endpoint, data, params } = req.body;

        if (!serviceType || !serviceInstanceId || !method || !endpoint) {
            return res.status(400).json({ error: 'Missing required parameters: serviceType, serviceInstanceId, method, endpoint' });
        }

        try {
            const result = await ApiProxyService.makeRequest(serviceType, serviceInstanceId, method, endpoint, data, params);
            res.status(200).json(result);
        } catch (error) {
            // Log the error on the backend side
            console.error('Error in /api/proxy route:', error.message);
            // Send a generic error response to the frontend to avoid exposing internal details
            res.status(500).json({ error: 'Failed to proxy API request', details: error.message });
        }
    });

// --- Widget Types API Routes ---

// GET all widget types
app.get('/api/widget-types', async (req, res) => {
  try {
    const widgetTypes = await WidgetService.getAllWidgetTypes();
    res.json(widgetTypes);
  } catch (error) {
    console.error('Error getting all widget types:', error);
    res.status(500).json({ error: 'Failed to retrieve widget types', details: error.message });
  }
});

// GET a widget type by ID or name
app.get('/api/widget-types/:identifier', async (req, res) => {
  const identifier = req.params.identifier;
  try {
    let widgetType;
    if (isNaN(identifier)) {
      // Assume identifier is a name if not a number
      widgetType = await WidgetService.getWidgetTypeByName(identifier);
    } else {
      // Assume identifier is an ID if it's a number
      widgetType = await WidgetService.getWidgetTypeById(parseInt(identifier, 10));
    }

    if (widgetType) {
      res.json(widgetType);
    } else {
      res.status(404).json({ error: 'Widget type not found' });
    }
  } catch (error) {
    console.error(`Error getting widget type ${identifier}:`, error);
    res.status(500).json({ error: 'Failed to retrieve widget type', details: error.message });
  }
});

// POST a new widget type
// Note: Authentication/Authorization needed for this route in a real app
app.post('/api/widget-types', async (req, res) => {
  const { name, display_name, is_custom, source_identifier, icon_identifier } = req.body;
  if (!name || !display_name) {
    return res.status(400).json({ error: 'Name and display_name are required' });
  }
  try {
    const existingWidgetType = await WidgetService.getWidgetTypeByName(name);
    if (existingWidgetType) {
        return res.status(409).json({ error: `Widget type with name '${name}' already exists` });
    }
    const newWidgetTypeId = await WidgetService.addWidgetType(name, display_name, is_custom, source_identifier, icon_identifier);
    res.status(201).json({ id: newWidgetTypeId, message: 'Widget type added successfully' });
  } catch (error) {
    console.error('Error adding widget type:', error);
    res.status(500).json({ error: 'Failed to add widget type', details: error.message });
  }
});

// DELETE a widget type by ID
// Note: Authentication/Authorization needed for this route in a real app
// Note: Should also delete associated widget instances
app.delete('/api/widget-types/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid widget type ID' });
  }
  try {
    const changes = await WidgetService.deleteWidgetType(id);
    if (changes > 0) {
      res.json({ message: 'Widget type deleted successfully', changes });
    } else {
      res.status(404).json({ error: 'Widget type not found' });
    }
  } catch (error) {
    console.error(`Error deleting widget type ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete widget type', details: error.message });
  }
});

// --- Widget Instances API Routes ---

// GET all widget instances for a specific dashboard
app.get('/api/dashboards/:dashboardId/widgets', async (req, res) => {
  const dashboardId = parseInt(req.params.dashboardId, 10);
   if (isNaN(dashboardId)) {
    return res.status(400).json({ error: 'Invalid dashboard ID' });
  }
  // Note: In a real app, verify the user has access to this dashboardId
  try {
    const widgets = await WidgetService.getWidgetInstancesByDashboard(dashboardId);
    res.json(widgets);
  } catch (error) {
    console.error(`Error getting widgets for dashboard ${dashboardId}:`, error);
    res.status(500).json({ error: 'Failed to retrieve widget instances', details: error.message });
  }
});

// GET a specific widget instance by ID
app.get('/api/widgets/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid widget instance ID' });
  }
  // Note: In a real app, verify the user has access to the dashboard this widget belongs to
  try {
    const widget = await WidgetService.getWidgetInstanceById(id);
    if (widget) {
      res.json(widget);
    } else {
      res.status(404).json({ error: 'Widget instance not found' });
    }
  } catch (error) {
    console.error(`Error getting widget instance ${id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve widget instance', details: error.message });
  }
});


// POST a new widget instance to a dashboard
// Note: Authentication/Authorization needed for this route in a real app
app.post('/api/dashboards/:dashboardId/widgets', async (req, res) => {
  const dashboardId = parseInt(req.params.dashboardId, 10);
  const { widget_type_id, config_json, position_x, position_y, width, height } = req.body;

  if (isNaN(dashboardId) || !widget_type_id || position_x === undefined || position_y === undefined || width === undefined || height === undefined) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Note: In a real app, verify the user has access to this dashboardId
  // Note: Verify widget_type_id exists

  try {
    const newWidgetInstanceId = await WidgetService.addWidgetInstance(
      dashboardId,
      widget_type_id,
      config_json ? JSON.stringify(config_json) : null, // Ensure config_json is stringified
      position_x,
      position_y,
      width,
      height
    );
    res.status(201).json({ id: newWidgetInstanceId, message: 'Widget instance added successfully' });
  } catch (error) {
    console.error(`Error adding widget instance to dashboard ${dashboardId}:`, error);
    res.status(500).json({ error: 'Failed to add widget instance', details: error.message });
  }
});

// PUT (Update) a widget instance
// Note: Authentication/Authorization needed for this route in a real app
app.put('/api/widgets/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { config_json, position_x, position_y, width, height } = req.body;

  if (isNaN(id) || position_x === undefined || position_y === undefined || width === undefined || height === undefined) {
     return res.status(400).json({ error: 'Missing required fields or invalid ID' });
  }

  // Note: In a real app, verify the user has access to the dashboard this widget belongs to

  try {
    const changes = await WidgetService.updateWidgetInstance(
      id,
      config_json ? JSON.stringify(config_json) : null, // Ensure config_json is stringified
      position_x,
      position_y,
      width,
      height
    );
     if (changes > 0) {
      res.json({ message: 'Widget instance updated successfully', changes });
    } else {
      res.status(404).json({ error: 'Widget instance not found' });
    }
  } catch (error) {
    console.error(`Error updating widget instance ${id}:`, error);
    res.status(500).json({ error: 'Failed to update widget instance', details: error.message });
  }
});

// DELETE a widget instance by ID
// Note: Authentication/Authorization needed for this route in a real app
app.delete('/api/widgets/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid widget instance ID' });
  }
  // Note: In a real app, verify the user has access to the dashboard this widget belongs to
  try {
    const changes = await WidgetService.deleteWidgetInstance(id);
    if (changes > 0) {
      res.json({ message: 'Widget instance deleted successfully', changes });
    } else {
      res.status(404).json({ error: 'Widget instance not found' });
    }
  } catch (error) {
    console.error(`Error deleting widget instance ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete widget instance', details: error.message });
  }
});


    // --- User API Routes ---

// POST a new user (e.g., for initial setup or admin creation)
// Note: This route needs strong security/authentication in a real app
app.post('/api/users', async (req, res) => {
  const { username, password, preferences } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const newUserId = await UserService.addUser(username, password, preferences);
    // For security, don't return the password hash
    const newUser = await UserService.getUserById(newUserId);
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error('Error adding user:', error);
    // Check if the error is a unique constraint violation
    if (error.message.includes('UNIQUE constraint failed: Users.username')) {
        res.status(409).json({ error: 'Username already exists' });
    } else {
        res.status(500).json({ error: 'Failed to add user', details: error.message });
    }
  }
});

// GET a user by ID
app.get('/api/users/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  // Note: In a real app, ensure only authorized users can view user details
  try {
    const user = await UserService.getUserById(id);
    if (user) {
      // For security, don't return the password hash
      const { password_hash, ...userWithoutHash } = user;
      res.json(userWithoutHash);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(`Error getting user ${id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve user', details: error.message });
  }
});

// DELETE a user by ID
// Note: This route needs strong security/authentication in a real app
app.delete('/api/users/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  // Note: In a real app, ensure only authorized users can delete users
  try {
    const changes = await UserService.deleteUser(id);
    if (changes > 0) {
      res.json({ message: 'User deleted successfully', changes });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error(`Error deleting user ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete user', details: error.message });
  }
});


    // --- Dashboard API Routes ---

// POST a new dashboard for a user
// Note: Authentication/Authorization needed for this route in a real app
app.post('/api/users/:userId/dashboards', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const { name } = req.body;
   if (isNaN(userId)) {
    return res.status(400).json({ error: 'User ID and name are required' });
  }
  // Note: In a real app, verify the user exists and the requesting user is authorized
  try {
    const newDashboardId = await DashboardService.addDashboard(userId, name);
    res.status(201).json({ id: newDashboardId, message: 'Dashboard created successfully' });
  } catch (error) {
    console.error(`Error adding dashboard for user ${userId}:`, error);
    res.status(500).json({ error: 'Failed to add dashboard', details: error.message });
  }
});

// GET all dashboards for a user
app.get('/api/users/:userId/dashboards', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
   if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }
  // Note: In a real app, verify the requesting user is authorized to view these dashboards
  try {
    const dashboards = await DashboardService.getDashboardsByUserId(userId);
    res.json(dashboards);
  } catch (error) {
    console.error(`Error getting dashboards for user ${userId}:`, error);
    res.status(500).json({ error: 'Failed to retrieve dashboards', details: error.message });
  }
});

// GET a specific dashboard by ID
app.get('/api/dashboards/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid dashboard ID' });
  }
  // Note: In a real app, verify the requesting user is authorized to view this dashboard
  try {
    const dashboard = await DashboardService.getDashboardById(id);
    if (dashboard) {
      res.json(dashboard);
    } else {
      res.status(404).json({ error: 'Dashboard not found' });
    }
  } catch (error) {
    console.error(`Error getting dashboard ${id}:`, error);
    res.status(500).json({ error: 'Failed to retrieve dashboard', details: error.message });
  }
});

// DELETE a dashboard by ID
// Note: Authentication/Authorization needed for this route in a real app
// Note: Should also delete associated widget instances
app.delete('/api/dashboards/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid dashboard ID' });
  }
  // Note: In a real app, verify the requesting user is authorized to delete this dashboard
  try {
    const changes = await DashboardService.deleteDashboard(id);
    if (changes > 0) {
      res.json({ message: 'Dashboard deleted successfully', changes });
    } else {
      res.status(404).json({ error: 'Dashboard not found' });
    }
  } catch (error) {
    console.error(`Error deleting dashboard ${id}:`, error);
    res.status(500).json({ error: 'Failed to delete dashboard', details: error.message });
  }
});


    // --- Server Start ---

    app.listen(port, () => {
      console.log(`Mission Control Backend listening on port ${port}`);
    });

  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1); // Exit the process if database initialization fails
  });

// Close the database connection when the application is shutting down
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    }
    console.log('Database connection closed.');
    process.exit(0);
  });
});