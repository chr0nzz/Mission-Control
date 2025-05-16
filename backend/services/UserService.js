const db = require('../index').db; // Assuming db is exported from index.js
const bcrypt = require('bcrypt'); // Need to add bcrypt to package.json

// --- User CRUD ---

/**
 * Add a new user.
 * @param {string} username - The username.
 * @param {string} password - The plain text password (will be hashed).
 * @param {object} [preferences] - User preferences object (will be stored as JSON).
 * @returns {Promise<number>} - The ID of the newly inserted user.
 */
async function addUser(username, password, preferences = {}) {
    const password_hash = await bcrypt.hash(password, 10); // Hash the password
    const preferences_json = JSON.stringify(preferences);

    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO Users (username, password_hash, preferences_json) VALUES (?, ?, ?)');
        stmt.run(username, password_hash, preferences_json, function(err) {
            if (err) {
                // Check for unique constraint violation
                if (err.message.includes('UNIQUE constraint failed: Users.username')) {
                    reject(new Error(`Username '${username}' already exists.`));
                } else {
                    reject(err);
                }
            } else {
                resolve(this.lastID);
            }
        });
    });
}

/**
 * Get a user by their ID.
 * @param {number} id - The ID of the user.
 * @returns {Promise<object|undefined>} - The user object (excluding password hash) or undefined if not found.
 */
async function getUserById(id) {
    return new Promise((resolve, reject) => {
        // Exclude password_hash from the result for security
        db.get('SELECT id, username, preferences_json FROM Users WHERE id = ?', [id], (err, row) => {
            if (err) {
                reject(err);
            } else {
                if (row && row.preferences_json) {
                    row.preferences = JSON.parse(row.preferences_json);
                    delete row.preferences_json;
                }
                resolve(row);
            }
        });
    });
}

/**
 * Get a user by their username.
 * @param {string} username - The username.
 * @returns {Promise<object|undefined>} - The user object (including password hash for login) or undefined if not found.
 */
async function getUserByUsername(username) {
    return new Promise((resolve, reject) => {
        // Include password_hash for authentication purposes
        db.get('SELECT id, username, password_hash, preferences_json FROM Users WHERE username = ?', [username], (err, row) => {
            if (err) {
                reject(err);
            } else {
                 if (row && row.preferences_json) {
                    row.preferences = JSON.parse(row.preferences_json);
                    delete row.preferences_json;
                }
                resolve(row);
            }
        });
    });
}

/**
 * Update a user's preferences.
 * @param {number} id - The ID of the user.
 * @param {object} preferences - New preferences object.
 * @returns {Promise<number>} - The number of rows changed.
 */
async function updateUserPreferences(id, preferences) {
     const preferences_json = JSON.stringify(preferences);
    return new Promise((resolve, reject) => {
        db.run('UPDATE Users SET preferences_json = ? WHERE id = ?', [preferences_json, id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

/**
 * Delete a user by their ID.
 * Note: This should ideally also handle deleting associated dashboards, widgets, etc.
 * @param {number} id - The ID of the user.
 * @returns {Promise<number>} - The number of rows deleted.
 */
async function deleteUser(id) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM Users WHERE id = ?', [id], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

module.exports = {
    addUser,
    getUserById,
    getUserByUsername,
    updateUserPreferences,
    deleteUser,
};