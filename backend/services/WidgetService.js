const db = require('../index').db; // Assuming db is exported from index.js

// --- WidgetTypes CRUD ---

/**
 * Add a new widget type.
 * @param {string} name - Unique system name for the widget type.
 * @param {string} display_name - User-friendly name.
 * @param {boolean} is_custom - True if it's a custom widget.
 * @param {string} [source_identifier] - Path or URL for custom widgets.
 * @param {string} [icon_identifier] - Identifier for the widget icon.
 * @returns {Promise<number>} - The ID of the newly inserted widget type.
 */
async function addWidgetType(name, display_name, is_custom, source_identifier = null, icon_identifier = null) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO WidgetTypes (name, display_name, is_custom, source_identifier, icon_identifier) VALUES (?, ?, ?, ?, ?)');
        stmt.run(name, display_name, is_custom ? 1 : 0, source_identifier, icon_identifier, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

/**
 * Get a widget type by its ID.
 * @param {number} id - The ID of the widget type.
 * @returns {Promise<object|undefined>} - The widget type object or undefined if not found.
 */
async function getWidgetTypeById(id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM WidgetTypes WHERE id = ?', [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

/**
 * Get a widget type by its unique name.
 * @param {string} name - The unique system name of the widget type.
 * @returns {Promise<object|undefined>} - The widget type object or undefined if not found.
 */
async function getWidgetTypeByName(name) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM WidgetTypes WHERE name = ?', [name], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

/**
 * Get all widget types.
 * @returns {Promise<Array<object>>} - An array of all widget type objects.
 */
async function getAllWidgetTypes() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM WidgetTypes', [], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Delete a widget type by its ID.
 * Note: This should ideally also handle deleting associated widget instances.
 * @param {number} id - The ID of the widget type.
 * @returns {Promise<number>} - The number of rows deleted.
 */
async function deleteWidgetType(id) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM WidgetTypes WHERE id = ?', [id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

// --- Widgets (Instances) CRUD ---

/**
 * Add a new widget instance to a dashboard.
 * @param {number} dashboard_id - The ID of the dashboard.
 * @param {number} widget_type_id - The ID of the widget type.
 * @param {string} [config_json] - JSON string for widget instance configuration.
 * @param {number} position_x - X-coordinate on the grid.
 * @param {number} position_y - Y-coordinate on the grid.
 * @param {number} width - Width on the grid.
 * @param {number} height - Height on the grid.
 * @returns {Promise<number>} - The ID of the newly inserted widget instance.
 */
async function addWidgetInstance(dashboard_id, widget_type_id, config_json = null, position_x, position_y, width, height) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO Widgets (dashboard_id, widget_type_id, config_json, position_x, position_y, width, height) VALUES (?, ?, ?, ?, ?, ?, ?)');
        stmt.run(dashboard_id, widget_type_id, config_json, position_x, position_y, width, height, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

/**
 * Get a widget instance by its ID.
 * @param {number} id - The ID of the widget instance.
 * @returns {Promise<object|undefined>} - The widget instance object or undefined if not found.
 */
async function getWidgetInstanceById(id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM Widgets WHERE id = ?', [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

/**
 * Get all widget instances for a specific dashboard.
 * @param {number} dashboard_id - The ID of the dashboard.
 * @returns {Promise<Array<object>>} - An array of widget instance objects for the dashboard.
 */
async function getWidgetInstancesByDashboard(dashboard_id) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM Widgets WHERE dashboard_id = ?', [dashboard_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Update a widget instance's configuration and layout.
 * @param {number} id - The ID of the widget instance.
 * @param {string} [config_json] - New JSON string for widget instance configuration.
 * @param {number} position_x - New X-coordinate.
 * @param {number} position_y - New Y-coordinate.
 * @param {number} width - New width.
 * @param {number} height - New height.
 * @returns {Promise<number>} - The number of rows changed.
 */
async function updateWidgetInstance(id, config_json, position_x, position_y, width, height) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE Widgets SET config_json = ?, position_x = ?, position_y = ?, width = ?, height = ? WHERE id = ?',
            [config_json, position_x, position_y, width, height, id],
            function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this.changes);
                }
            }
        );
    });
}

/**
 * Delete a widget instance by its ID.
 * @param {number} id - The ID of the widget instance.
 * @returns {Promise<number>} - The number of rows deleted.
 */
async function deleteWidgetInstance(id) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM Widgets WHERE id = ?', [id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

module.exports = {
    addWidgetType,
    getWidgetTypeById,
    getWidgetTypeByName,
    getAllWidgetTypes,
    deleteWidgetType,
    addWidgetInstance,
    getWidgetInstanceById,
    getWidgetInstancesByDashboard,
    updateWidgetInstance,
    deleteWidgetInstance,
};