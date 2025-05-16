const db = require('../index').db; // Assuming db is exported from index.js

// --- Dashboard CRUD ---

/**
 * Add a new dashboard for a user.
 * @param {number} user_id - The ID of the user who owns the dashboard.
 * @param {string} name - The name of the dashboard.
 * @returns {Promise<number>} - The ID of the newly inserted dashboard.
 */
async function addDashboard(user_id, name) {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO Dashboards (user_id, name) VALUES (?, ?)');
        stmt.run(user_id, name, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

/**
 * Get a dashboard by its ID.
 * @param {number} id - The ID of the dashboard.
 * @returns {Promise<object|undefined>} - The dashboard object or undefined if not found.
 */
async function getDashboardById(id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM Dashboards WHERE id = ?', [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

/**
 * Get all dashboards for a specific user.
 * @param {number} user_id - The ID of the user.
 * @returns {Promise<Array<object>>} - An array of dashboard objects for the user.
 */
async function getDashboardsByUserId(user_id) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM Dashboards WHERE user_id = ?', [user_id], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Update a dashboard's name.
 * @param {number} id - The ID of the dashboard.
 * @param {string} name - The new name for the dashboard.
 * @returns {Promise<number>} - The number of rows changed.
 */
async function updateDashboard(id, name) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE Dashboards SET name = ? WHERE id = ?', [name, id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

/**
 * Delete a dashboard by its ID.
 * Note: This should ideally also handle deleting associated widget instances.
 * @param {number} id - The ID of the dashboard.
 * @returns {Promise<number>} - The number of rows deleted.
 */
async function deleteDashboard(id) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM Dashboards WHERE id = ?', [id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

module.exports = {
    addDashboard,
    getDashboardById,
    getDashboardsByUserId,
    updateDashboard,
    deleteDashboard,
};